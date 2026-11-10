import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, Field, PageTitle, Pill, inputCls } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { uid } from "@/lib/store";
import { dataLocal, ESTADOS, estatisticasDias, useDias, type DayLog } from "@/lib/days";
import { DiarioTabs } from "./diario";

export const Route = createFileRoute("/diario_/dias")({
  head: () => ({ meta: [
    { title: "Meus Dias · Agente Trader" }, { name: "description", content: "Check-in, concentração e resultados dos seus dias de trading." },
    { property: "og:title", content: "Meus Dias · Agente Trader" }, { property: "og:description", content: "Check-in, concentração e resultados dos seus dias de trading." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: MeusDias,
});
const dinheiro = (n: number | null) => n === null ? "-" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function MeusDias() {
  const { dias, carregando, erro, salvar, tentar } = useDias();
  const [data, setData] = useState(dataLocal());
  const [estado, setEstado] = useState<string>("");
  const [concentracao, setConcentracao] = useState<number | null>(null);
  const [resultado, setResultado] = useState("");
  const [stops, setStops] = useState("0");
  const [ativos, setAtivos] = useState("");
  const [notas, setNotas] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");
  const original = dias.find((d) => d.data === data);
  useEffect(() => {
    setEstado(original?.estado ?? ""); setConcentracao(original?.concentracao ?? null);
    setResultado(original?.resultado_rs == null ? "" : String(original.resultado_rs));
    setStops(String(original?.stops ?? 0)); setAtivos(original?.ativos ?? ""); setNotas(original?.notas ?? ""); setAviso("");
  }, [data, original]);
  const s = estatisticasDias(dias);
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!estado || concentracao === null) { setAviso("Escolha seu estado e a concentração."); return; }
    setSalvando(true); setAviso("");
    try {
      await salvar({ id: original?.id ?? uid(), data, estado, concentracao, resultado_rs: resultado === "" ? null : Number(resultado), stops: Number(stops), ativos: ativos.trim() || null, notas: notas.trim() || null });
      setAviso("Dia salvo.");
    } catch (e) { setAviso(e instanceof Error ? e.message : String(e)); }
    finally { setSalvando(false); }
  }
  function editar(d: DayLog) { setData(d.data); window.scrollTo({ top: 0, behavior: "smooth" }); }
  return <div className="space-y-4">
    <PageTitle>Diário</PageTitle><DiarioTabs ativo="dias" />
    {erro && <p role="alert" className="text-sm text-warn">Não consegui carregar seus dias. {erro.message} <Button variant="outline" onClick={() => void tentar()} className="min-h-11">Tentar novamente</Button></p>}
    <div className="grid grid-cols-2 gap-3 border-y border-border py-3 text-sm">
      {[["Dias registrados", String(s.total)], ["Últimos 10 dias", dinheiro(s.ultimos10)], ["Média · concentração 4–5", dinheiro(s.alta)], ["Média · concentração 1–3", dinheiro(s.baixa)]].map(([label, valor]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{valor}</p></div>)}
    </div>
    <Card title={data === dataLocal() ? "Check-in de hoje" : "Editar dia"}>
      <form onSubmit={enviar} className="space-y-3">
        <Field label="Data"><input required type="date" className={inputCls} value={data} onChange={(e) => setData(e.target.value)} /></Field>
        <Field label="Como estou antes de operar"><div className="grid grid-cols-2 gap-2">{ESTADOS.map((v) => <Button type="button" key={v} variant={estado === v ? "default" : "outline"} aria-pressed={estado === v} className="min-h-11" onClick={() => setEstado(v)}>{v}</Button>)}</div></Field>
        <Field label="Concentração"><div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((n) => <Button type="button" key={n} aria-label={`Concentração ${n}`} aria-pressed={concentracao === n} variant={concentracao === n ? "default" : "outline"} className="min-h-11 px-0" onClick={() => setConcentracao(n)}>{n}</Button>)}</div></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Resultado do dia (R$)"><input type="number" step="any" inputMode="decimal" className={inputCls} value={resultado} onChange={(e) => setResultado(e.target.value)} /></Field>
          <Field label="Número de stops"><input required type="number" min="0" step="1" className={inputCls} value={stops} onChange={(e) => setStops(e.target.value)} /></Field>
        </div>
        <Field label="Ativos"><input className={inputCls} value={ativos} onChange={(e) => setAtivos(e.target.value)} placeholder="WINZ26, WDOZ26" /></Field>
        <Field label="Notas"><textarea className={`${inputCls} py-2`} rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} /></Field>
        {aviso && <p role="status" className="text-sm">{aviso}</p>}
        <Button disabled={salvando || carregando || !!erro} className="min-h-11 w-full" type="submit">{salvando ? "Salvando..." : original ? "Salvar alterações do dia" : "Salvar check-in"}</Button>
      </form>
    </Card>
    {carregando ? <p>Carregando seus dias...</p> : !dias.length ? <p className="text-sm text-muted-foreground">Nenhum dia registrado.</p> : <ul className="space-y-3">{[...dias].sort((a, b) => b.data.localeCompare(a.data)).map((d) => <li key={d.id} className="rounded-[14px] border border-border bg-card p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><b>{new Date(`${d.data}T12:00:00`).toLocaleDateString("pt-BR")}</b><Pill tone={d.resultado_rs === null || d.resultado_rs === 0 ? "muted" : d.resultado_rs > 0 ? "ok" : "warn"}>{d.resultado_rs === null ? "Em andamento" : d.resultado_rs > 0 ? "Dia positivo" : d.resultado_rs < 0 ? "Dia negativo" : "Dia neutro"}</Pill></div>
      <p className="mt-2 font-semibold">{dinheiro(d.resultado_rs)} · {d.stops} stops</p>
      <p>{d.estado} · Concentração {d.concentracao}/5</p><p className="text-muted-foreground">Ativos: {d.ativos || "-"}</p>
      <p className="mt-2 break-words whitespace-pre-wrap">{d.notas || "-"}</p><Button variant="outline" className="mt-3 min-h-11" onClick={() => editar(d)}>Editar dia</Button>
    </li>)}</ul>}
  </div>;
}