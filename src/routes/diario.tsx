import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Field, PageTitle, Pill, Segmented, inputCls } from "@/components/app/ui";
import { PONTO_RS, uid, useStore, type Ativo, type Trade } from "@/lib/store";

export const Route = createFileRoute("/diario")({
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

function Diario() {
  const { trades, setTrades, config } = useStore();
  const vazio = { dataHora: agora(), ativo: config.ativoPadrao, lado: "Compra" as Trade["lado"], alinhados: "Sim", entrada: "", stop: "", alvo: "", saida: "", resultadoRs: "", resultadoR: "", seguiu: "Sim", execucao: "No gatilho" as Trade["execucao"], saidaAlvo: "" };
  const [f, setF] = useState(vazio);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const calc = () => {
    const ent = +f.entrada, st = +f.stop, sa = +f.saida;
    if (!ent || !st || !sa) return;
    const dir = f.lado === "Compra" ? 1 : -1;
    const pts = (sa - ent) * dir;
    const risco = Math.abs(ent - st);
    setF({ ...f, resultadoRs: (pts * PONTO_RS[f.ativo]).toFixed(2), resultadoR: risco ? (pts / risco).toFixed(2) : "" });
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    setTrades([{ id: uid(), dataHora: f.dataHora, ativo: f.ativo, lado: f.lado, alinhados: f.alinhados === "Sim", entrada: +f.entrada, stop: +f.stop, alvo: +f.alvo, saida: +f.saida, resultadoRs: +f.resultadoRs, resultadoR: +f.resultadoR, seguiuChecklist: f.seguiu === "Sim", execucao: f.execucao, saidaAlvo: f.saidaAlvo }, ...trades]);
    setF({ ...vazio, dataHora: agora() });
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

      <Card title="Revisão da semana">
        <p className="text-sm">{semana.length} trades · <b>{totalR >= 0 ? "+" : ""}{totalR.toFixed(1)} R</b> ({totalR >= 0 ? "positivo" : "negativo"})</p>
        {top && top[1] > 0 ? (
          <p className="mt-2 text-sm">Erro que mais se repetiu: <span className="font-semibold text-warn">{top[0]}</span> ({top[1]}x)</p>
        ) : <p className="mt-2 text-sm text-ok">Nenhum erro repetido. Siga assim.</p>}
      </Card>

      <Card title="Novo trade">
        <form onSubmit={salvar} className="space-y-3">
          <Field label="Data e hora"><input type="datetime-local" className={inputCls} value={f.dataHora} onChange={set("dataHora")} /></Field>
          <Field label="Ativo"><Segmented<Ativo> value={f.ativo} options={["WINZ26", "WDOZ26"]} onChange={(v) => setF({ ...f, ativo: v })} /></Field>
          <Field label="Lado"><Segmented<Trade["lado"]> value={f.lado} options={["Compra", "Venda"]} onChange={(v) => setF({ ...f, lado: v })} /></Field>
          <Field label="60 e 15 alinhados?"><Segmented value={f.alinhados} options={["Sim", "Não"]} onChange={(v) => setF({ ...f, alinhados: v })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            {(["entrada", "stop", "alvo", "saida"] as const).map((k) => (
              <Field key={k} label={k === "saida" ? "Saída" : k[0].toUpperCase() + k.slice(1)}>
                <input type="number" inputMode="decimal" className={inputCls} value={f[k]} onChange={set(k)} onBlur={calc} />
              </Field>
            ))}
            <Field label="Resultado (R$)"><input type="number" inputMode="decimal" className={inputCls} value={f.resultadoRs} onChange={set("resultadoRs")} /></Field>
            <Field label="Resultado (R)"><input type="number" inputMode="decimal" className={inputCls} value={f.resultadoR} onChange={set("resultadoR")} /></Field>
          </div>
          <Field label="Seguiu o checklist?"><Segmented value={f.seguiu} options={["Sim", "Não"]} onChange={(v) => setF({ ...f, seguiu: v })} /></Field>
          <Field label="Execução"><Segmented<Trade["execucao"]> value={f.execucao} options={["No gatilho", "Antecipei"]} onChange={(v) => setF({ ...f, execucao: v })} /></Field>
          <Field label="Onde teria saído no alvo?"><input className={inputCls} value={f.saidaAlvo} onChange={set("saidaAlvo")} placeholder="Ex.: teria batido às 11:40" /></Field>
          <button className="w-full rounded-lg bg-primary font-semibold text-primary-foreground">Salvar trade</button>
        </form>
      </Card>

      <Card title="Trades">
        <ul className="divide-y divide-border">
          {trades.map((t) => (
            <li key={t.id} className="py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.ativo} · {t.lado}</span>
                <Pill tone={t.resultadoRs >= 0 ? "ok" : "warn"}>{t.resultadoRs >= 0 ? "Ganho" : "Perda"} R$ {t.resultadoRs.toFixed(2)} · {t.resultadoR} R</Pill>
              </div>
              <p className="mt-1 text-muted-foreground">{new Date(t.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {t.execucao} · checklist {t.seguiuChecklist ? "seguido" : "não seguido"} · {t.alinhados ? "alinhados" : "desalinhados"}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
