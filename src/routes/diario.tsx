import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Field, PageTitle, Pill, Segmented, inputCls } from "@/components/app/ui";
import { PONTO_RS, uid, useStore, type Ativo, type Trade } from "@/lib/store";
import { desfecho, numeroOpcional } from "@/lib/trades";

export const Route = createFileRoute("/diario")({
  validateSearch: (s: Record<string, unknown>): { editar?: string } => (typeof s["editar"] === "string" ? { editar: s["editar"] } : {}),
  head: () => ({
    meta: [
      { title: "Diário · Agente Trader" },
      { name: "description", content: "Registre seus trades e revise os erros da semana." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Diário · Agente Trader" },
      { property: "og:description", content: "Registre seus trades e revise os erros da semana." },
    ],
  }),
  component: Diario,
});

const agora = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function DiarioTabs({ ativo }: { ativo: "registrar" | "historico" | "dias" }) {
  const cls = (a: boolean) => `flex min-h-11 flex-1 items-center justify-center rounded-md text-sm font-medium ${a ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`;
  return (
    <div className="mb-4 flex gap-1 rounded-lg border border-border bg-background p-1">
      <Link to="/diario" className={cls(ativo === "registrar")}>Registro rápido</Link>
      <Link to="/diario/historico" className={cls(ativo === "historico")}>Histórico</Link>
      <Link to="/diario/dias" className={cls(ativo === "dias")}>Meus Dias</Link>
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
  const [detalhado, setDetalhado] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!original) return;
    const o = original;
    setF({ dataHora: o.dataHora, ativo: o.ativo, lado: o.lado, alinhados: o.alinhados ? "Sim" : "Não", entrada: o.entrada == null ? "" : String(o.entrada), stop: o.stop == null ? "" : String(o.stop), alvo: o.alvo == null ? "" : String(o.alvo), saida: o.saida == null ? "" : String(o.saida), resultadoRs: String(o.resultadoRs), resultadoR: o.resultadoR == null ? "" : String(o.resultadoR), seguiu: o.seguiuChecklist ? "Sim" : "Não", execucao: o.execucao, saidaAlvo: o.saidaAlvo, notas: o.notas ?? "" });

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

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    const id = original?.id ?? uid();
    setSalvando(true);
    try {
      const t: Trade = { id, dataHora: f.dataHora, ativo: f.ativo, lado: f.lado, alinhados: f.alinhados === "Sim", entrada: numeroOpcional(f.entrada), stop: numeroOpcional(f.stop), alvo: numeroOpcional(f.alvo), saida: numeroOpcional(f.saida), resultadoRs: +f.resultadoRs, resultadoR: numeroOpcional(f.resultadoR), seguiuChecklist: f.seguiu === "Sim", execucao: f.execucao, saidaAlvo: f.saidaAlvo, imagens: original?.imagens ?? [], notas: f.notas.trim() || null, leituraIa: original?.leituraIa ?? null };
      if (original) { setTrades(trades.map((x) => (x.id === id ? t : x))); navigate({ to: "/diario/trade/$id", params: { id } }); }
      else { setTrades([t, ...trades]); setF({ ...vazio, dataHora: agora() }); setSucesso(true); }
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
  const totalR = semana.reduce((s, t) => s + (t.resultadoR ?? 0), 0);

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

      <Card title={original ? "Editar trade" : "Registro rápido"}>
        <form onSubmit={salvar} className="space-y-3">
          <Field label="Data e hora"><input required type="datetime-local" className={`${inputCls} min-h-11`} value={f.dataHora} onChange={set("dataHora")} /></Field>
          <Field label="Ativo"><Segmented<Ativo> value={f.ativo} options={["WINZ26", "WDOZ26"]} onChange={(v) => setF({ ...f, ativo: v })} /></Field>
          <Field label="Lado"><Segmented<Trade["lado"]> value={f.lado} options={["Compra", "Venda"]} onChange={(v) => setF({ ...f, lado: v })} /></Field>
          <Field label="Resultado (R$)"><input required type="number" step="any" inputMode="decimal" className={inputCls} value={f.resultadoRs} onChange={set("resultadoRs")} /></Field>
          <Button variant="outline" type="button" className="min-h-11" aria-expanded={detalhado} onClick={() => setDetalhado(!detalhado)}>Detalhado</Button>
          {detalhado && <div className="space-y-3">
            <Field label="60 e 15 alinhados?"><Segmented value={f.alinhados} options={["Sim", "Não"]} onChange={(v) => setF({ ...f, alinhados: v })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              {(["entrada", "stop", "alvo", "saida"] as const).map((k) => <Field key={k} label={{ entrada: "Entrada", stop: "Stop", alvo: "Alvo", saida: "Saída" }[k]}><input type="number" step="any" inputMode="decimal" className={inputCls} value={f[k]} onChange={set(k)} onBlur={calc} /></Field>)}
              <Field label="Resultado (R)"><input type="number" step="any" className={inputCls} value={f.resultadoR} onChange={set("resultadoR")} /></Field>
            </div>
            <Field label="Onde teria saído no alvo?"><input className={inputCls} value={f.saidaAlvo} onChange={set("saidaAlvo")} /></Field>
          </div>}
          <Field label="Seguiu o checklist?"><Segmented value={f.seguiu} options={["Sim", "Não"]} onChange={(v) => setF({ ...f, seguiu: v })} /></Field>
          <Field label="Execução"><Segmented<Trade["execucao"]> value={f.execucao} options={["No gatilho", "Antecipei"]} onChange={(v) => setF({ ...f, execucao: v })} /></Field>
          <Field label="Notas"><textarea rows={3} className={`${inputCls} py-2`} value={f.notas} onChange={set("notas")} placeholder="O que você viu, sentiu, aprendeu..." /></Field>
          {sucesso && <p role="status" className="text-sm text-ok">Trade salvo.</p>}
          {erro && <p className="text-sm text-warn">Erro: {erro}</p>}
          <Button disabled={salvando} className="min-h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-60">{salvando ? "Salvando..." : original ? "Salvar alterações" : "Salvar trade"}</Button>
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
