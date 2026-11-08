import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageTitle, Pill } from "@/components/app/ui";
import { Print } from "@/components/app/Print";
import { useStore } from "@/lib/store";
import { removerPrint } from "@/lib/supabase";
import { desfecho, fmtR } from "@/lib/trades";

export const Route = createFileRoute("/diario_/trade/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do trade · Agente Trader" },
      { name: "description", content: "Prints, campos e notas de um trade registrado." },
      { property: "og:title", content: "Detalhe do trade · Agente Trader" },
      { property: "og:description", content: "Prints, campos e notas de um trade registrado." },
    ],
  }),
  component: Detalhe,
});

function Detalhe() {
  const { id } = Route.useParams();
  const { trades, setTrades } = useStore();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const t = trades.find((x) => x.id === id);

  if (!t) return (
    <div className="space-y-4"><PageTitle>Trade não encontrado</PageTitle>
      <Link to="/diario/historico" className="text-ok">Voltar ao histórico</Link></div>
  );

  const excluir = async () => {
    if (!confirm("Excluir este trade e suas imagens?")) return;
    setExcluindo(true);
    await Promise.all((t.imagens ?? []).map((p) => removerPrint(p).catch(() => undefined)));
    setTrades(trades.filter((x) => x.id !== id));
    navigate({ to: "/diario/historico" });
  };

  const linhas: [string, string][] = [
    ["Data", new Date(t.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })],
    ["60 e 15", t.alinhados ? "Alinhados" : "Desalinhados"], ["Entrada", String(t.entrada)], ["Stop", String(t.stop)],
    ["Alvo", String(t.alvo)], ["Saída", String(t.saida)], ["Resultado", `R$ ${t.resultadoRs.toFixed(2)} · ${fmtR(t.resultadoR)}`],
    ["Checklist", t.seguiuChecklist ? "Seguido" : "Não seguido"], ["Teria saído no alvo", t.saidaAlvo || "—"],
  ];

  return (
    <div className="space-y-4">
      <Link to="/diario/historico" className="inline-flex min-h-11 items-center text-sm text-muted-foreground">← Histórico</Link>
      <PageTitle>{t.ativo} · {t.lado}</PageTitle>
      <div className="flex flex-wrap gap-1">
        <Pill tone={t.resultadoRs > 0 ? "ok" : t.resultadoRs < 0 ? "warn" : "muted"}>{desfecho(t)}</Pill>
        <Pill tone={t.execucao === "No gatilho" ? "ok" : "warn"}>{t.execucao}</Pill>
      </div>

      {(t.imagens ?? []).map((p) => <Print key={p} path={p} onClick={() => setZoom(p)} className="max-h-96 w-full rounded-[14px] border border-border" />)}

      <Card title="Campos">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {linhas.map(([k, v]) => (<div key={k}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>))}
        </dl>
      </Card>
      {t.notas && <Card title="Notas"><p className="whitespace-pre-wrap text-sm">{t.notas}</p></Card>}
      {t.leituraIa && <Card title="Leitura do agente"><p className="whitespace-pre-wrap text-sm">{t.leituraIa}</p></Card>}

      <div className="grid grid-cols-2 gap-2">
        <Link to="/diario" search={{ editar: t.id }} className="flex min-h-11 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">Editar</Link>
        <button onClick={excluir} disabled={excluindo} className="min-h-11 rounded-lg border border-warn/50 font-semibold text-warn">{excluindo ? "Excluindo..." : "Excluir"}</button>
      </div>

      {zoom && (
        <button aria-label="Fechar imagem" onClick={() => setZoom(null)} className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 p-2">
          <Print path={zoom} className="max-h-full max-w-full object-contain" />
        </button>
      )}
    </div>
  );
}
