import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Card, Field, PageTitle, Pill, Segmented, inputCls } from "@/components/app/ui";
import { Print } from "@/components/app/Print";
import { PONTO_RS, uid, useStore, type Ativo, type Trade } from "@/lib/store";
import { removerPrint, uploadPrint, userId } from "@/lib/supabase";
import { desfecho } from "@/lib/trades";

export const Route = createFileRoute("/diario")({
  validateSearch: (s: Record<string, unknown>): { editar?: string } => (typeof s.editar === "string" ? { editar: s.editar } : {}),
  head: () => ({
    meta: [
      { title: "Diário · Agente Trader" },
      { name: "description", content: "Registre seus trades e revise os erros da semana." },
      { property: "og:title", content: "Diário · Agente Trader" },
      { property: "og:description", content: "Registre seus trades e revise os erros da semana." },
    ],
  }),
  component: Diario,
});

const agora = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
type Img = { path: string } | { file: File; preview: string };

export function DiarioTabs({ ativo }: { ativo: "registrar" | "historico" }) {
  const cls = (a: boolean) => `flex min-h-11 flex-1 items-center justify-center rounded-md text-sm font-medium ${a ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`;
  return (
    <div className="mb-4 flex gap-1 rounded-lg border border-border bg-background p-1">
      <Link to="/diario" className={cls(ativo === "registrar")}>Registrar</Link>
      <Link to="/diario/historico" className={cls(ativo === "historico")}>Histórico</Link>
    </div>
  );
}

function Diario() {
  const { trades, setTrades, config } = useStore();
  const { editar } = Route.useSearch();
  const navigate = useNavigate();
  const original = editar ? trades.find((t) => t.id === editar) : undefined;
  const vazio = { dataHora: agora(), ativo: config.ativoPadrao, lado: "Compra" as Trade["lado"], alinhados: "Sim", entrada: "", stop: "", alvo: "", saida: "", resultadoRs: "", resultadoR: "", seguiu: "Sim", execucao: "No gatilho" as Trade["execucao"], saidaAlvo: "", notas: "" };
  const [f, setF] = useState(vazio);
  const [imgs, setImgs] = useState<Img[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!original) return;
    const o = original;
    setF({ dataHora: o.dataHora, ativo: o.ativo, lado: o.lado, alinhados: o.alinhados ? "Sim" : "Não", entrada: String(o.entrada), stop: String(o.stop), alvo: String(o.alvo), saida: String(o.saida), resultadoRs: String(o.resultadoRs), resultadoR: String(o.resultadoR), seguiu: o.seguiuChecklist ? "Sim" : "Não", execucao: o.execucao, saidaAlvo: o.saidaAlvo, notas: o.notas ?? "" });
    setImgs((o.imagens ?? []).map((path) => ({ path })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original?.id]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const calc = () => {
    const ent = +f.entrada, st = +f.stop, sa = +f.saida;
    if (!ent || !st || !sa) return;
    const dir = f.lado === "Compra" ? 1 : -1;
    const pts = (sa - ent) * dir;
    const risco = Math.abs(ent - st);
    setF({ ...f, resultadoRs: (pts * PONTO_RS[f.ativo]).toFixed(2), resultadoR: risco ? (pts / risco).toFixed(2) : "" });
  };

  const addImgs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novos = Array.from(e.target.files ?? []).slice(0, 3 - imgs.length).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImgs([...imgs, ...novos]);
    e.target.value = "";
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    const id = original?.id ?? uid();
    const novos = imgs.filter((i): i is { file: File; preview: string } => "file" in i);
    if (novos.length && !userId()) { setErro("Entre na sua conta para guardar imagens."); return; }
    setSalvando(true);
    try {
      const paths: string[] = [];
      for (const i of imgs) paths.push("path" in i ? i.path : await uploadPrint(i.file, id));
      const removidos = (original?.imagens ?? []).filter((p) => !paths.includes(p));
      await Promise.all(removidos.map((p) => removerPrint(p).catch(() => undefined)));
      const t: Trade = { id, dataHora: f.dataHora, ativo: f.ativo, lado: f.lado, alinhados: f.alinhados === "Sim", entrada: +f.entrada, stop: +f.stop, alvo: +f.alvo, saida: +f.saida, resultadoRs: +f.resultadoRs, resultadoR: +f.resultadoR, seguiuChecklist: f.seguiu === "Sim", execucao: f.execucao, saidaAlvo: f.saidaAlvo, imagens: paths, notas: f.notas, leituraIa: original?.leituraIa ?? "" };
      if (original) { setTrades(trades.map((x) => (x.id === id ? t : x))); navigate({ to: "/diario/trade/$id", params: { id } }); }
      else { setTrades([t, ...trades]); setF({ ...vazio, dataHora: agora() }); setImgs([]); }
    } catch (err) { setErro(err instanceof Error ? err.message : String(err)); }
    setSalvando(false);
  };

  const semana = trades.filter((t) => Date.now() - new Date(t.dataHora).getTime() < 7 * 864e5);
  const erros: Record<string, number> = {
    "Antecipou a entrada": semana.filter((t) => t.execucao === "Antecipei").length,
    "Não seguiu o checklist": semana.filter((t) => !t.seguiuChecklist).length,
    "Operou com 60 e 15 desalinhados": semana.filter((t) => !t.alinhados).length,
  };
  const top = Object.entries(erros).sort((a, b) => b[1] - a[1])[0];
  const totalR = semana.reduce((s, t) => s + t.resultadoR, 0);

  return (
    <div className="space-y-4">
      <PageTitle>Diário</PageTitle>
      <DiarioTabs ativo="registrar" />

      {!original && (
        <Card title="Revisão da semana">
          <p className="text-sm">{semana.length} trades · <b>{totalR >= 0 ? "+" : ""}{totalR.toFixed(1)} R</b> ({totalR >= 0 ? "positivo" : "negativo"})</p>
          {top && top[1] > 0 ? (
            <p className="mt-2 text-sm">Erro que mais se repetiu: <span className="font-semibold text-warn">{top[0]}</span> ({top[1]}x)</p>
          ) : <p className="mt-2 text-sm text-ok">Nenhum erro repetido. Siga assim.</p>}
        </Card>
      )}

      <Card title={original ? "Editar trade" : "Novo trade"}>
        <form onSubmit={salvar} className="space-y-3">
          <Field label="Data e hora"><input type="datetime-local" className={`${inputCls} min-h-11`} value={f.dataHora} onChange={set("dataHora")} /></Field>
          <Field label="Ativo"><Segmented<Ativo> value={f.ativo} options={["WINZ26", "WDOZ26"]} onChange={(v) => setF({ ...f, ativo: v })} /></Field>
          <Field label="Lado"><Segmented<Trade["lado"]> value={f.lado} options={["Compra", "Venda"]} onChange={(v) => setF({ ...f, lado: v })} /></Field>
          <Field label="60 e 15 alinhados?"><Segmented value={f.alinhados} options={["Sim", "Não"]} onChange={(v) => setF({ ...f, alinhados: v })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            {(["entrada", "stop", "alvo", "saida"] as const).map((k) => (
              <Field key={k} label={k === "saida" ? "Saída" : k[0]!.toUpperCase() + k.slice(1)}>
                <input type="number" inputMode="decimal" className={inputCls} value={f[k]} onChange={set(k)} onBlur={calc} />
              </Field>
            ))}
            <Field label="Resultado (R$)"><input type="number" inputMode="decimal" className={inputCls} value={f.resultadoRs} onChange={set("resultadoRs")} /></Field>
            <Field label="Resultado (R)"><input type="number" inputMode="decimal" className={inputCls} value={f.resultadoR} onChange={set("resultadoR")} /></Field>
          </div>
          <Field label="Seguiu o checklist?"><Segmented value={f.seguiu} options={["Sim", "Não"]} onChange={(v) => setF({ ...f, seguiu: v })} /></Field>
          <Field label="Execução"><Segmented<Trade["execucao"]> value={f.execucao} options={["No gatilho", "Antecipei"]} onChange={(v) => setF({ ...f, execucao: v })} /></Field>
          <Field label="Onde teria saído no alvo?"><input className={inputCls} value={f.saidaAlvo} onChange={set("saidaAlvo")} placeholder="Ex.: teria batido às 11:40" /></Field>

          <div className="text-sm">
            <span className="text-muted-foreground">Prints (até 3)</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {imgs.map((i, n) => (
                <div key={"path" in i ? i.path : i.preview} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                  {"path" in i ? <Print path={i.path} className="h-full w-full" /> : <img src={i.preview} alt="Print novo" className="h-full w-full object-cover" />}
                  <button type="button" aria-label="Remover imagem" onClick={() => setImgs(imgs.filter((_, j) => j !== n))}
                    className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-1"><span className="rounded-full bg-background/90 p-0.5"><X className="h-4 w-4" /></span></button>
                </div>
              ))}
              {imgs.length < 3 && (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                  + Adicionar
                  <input type="file" accept="image/*" multiple className="hidden" onChange={addImgs} />
                </label>
              )}
            </div>
          </div>

          <Field label="Notas"><textarea rows={3} className={`${inputCls} py-2`} value={f.notas} onChange={set("notas")} placeholder="O que você viu, sentiu, aprendeu..." /></Field>
          {erro && <p className="text-sm text-warn">Erro: {erro}</p>}
          <button disabled={salvando} className="min-h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-60">{salvando ? "Salvando..." : original ? "Salvar alterações" : "Salvar trade"}</button>
        </form>
      </Card>

      {!original && (
        <Card title="Últimos trades" action={<Link to="/diario/historico" className="text-sm text-ok">Ver histórico</Link>}>
          <ul className="divide-y divide-border">
            {trades.slice(0, 5).map((t) => (
              <li key={t.id}>
                <Link to="/diario/trade/$id" params={{ id: t.id }} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-semibold">{t.ativo} · {t.lado}</span>
                  <Pill tone={t.resultadoRs > 0 ? "ok" : t.resultadoRs < 0 ? "warn" : "muted"}>{desfecho(t)} R$ {t.resultadoRs.toFixed(2)}</Pill>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
