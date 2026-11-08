import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageTitle, Pill } from "@/components/app/ui";
import { Print } from "@/components/app/Print";
import { useStore } from "@/lib/store";
import { FILTROS, desfecho, estatisticas, filtrar, fmtR, ordenar, type Filtro } from "@/lib/trades";
import { DiarioTabs } from "./diario";

export const Route = createFileRoute("/diario_/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de trades · Agente Trader" },
      { name: "description", content: "Todos os seus trades com prints, filtros e estatísticas." },
      { property: "og:title", content: "Histórico de trades · Agente Trader" },
      { property: "og:description", content: "Todos os seus trades com prints, filtros e estatísticas." },
    ],
  }),
  component: Historico,
});

function Historico() {
  const { trades } = useStore();
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const s = estatisticas(trades);
  const lista = ordenar(filtrar(trades, filtro));

  return (
    <div className="space-y-4">
      <PageTitle>Diário</PageTitle>
      <DiarioTabs ativo="historico" />

      <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
        {[["Trades", String(s.total)], ["Acerto", s.acerto === null ? "—" : `${s.acerto.toFixed(0)}%`], ["R médio", fmtR(s.rMedio)], ["No gatilho", fmtR(s.rGatilho)], ["Antecipei", fmtR(s.rAntecipei)]].map(([l, v]) => (
          <div key={l} className="rounded-[14px] border border-border bg-card p-2">
            <p className="text-[11px] text-muted-foreground">{l}</p>
            <p className="font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTROS.map((f) => (
          <button key={f} onClick={() => setFiltro(f)} aria-pressed={filtro === f}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm ${filtro === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{f}</button>
        ))}
      </div>

      {lista.length === 0 ? <Card><p className="text-sm text-muted-foreground">Nenhum trade neste filtro.</p></Card> : (
        <ul className="space-y-2">
          {lista.map((t) => (
            <li key={t.id}>
              <Link to="/diario/trade/$id" params={{ id: t.id }} className="flex gap-3 rounded-[14px] border border-border bg-card p-3">
                {t.imagens?.[0] ? <Print path={t.imagens[0]} className="h-16 w-16 shrink-0 rounded-lg" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] text-muted-foreground">Sem print</div>}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{t.ativo} · {t.lado}</p>
                  <p className="text-muted-foreground">{new Date(t.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · R$ {t.resultadoRs.toFixed(2)} · {fmtR(t.resultadoR)}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Pill tone={t.resultadoRs > 0 ? "ok" : t.resultadoRs < 0 ? "warn" : "muted"}>{desfecho(t)}</Pill>
                    <Pill tone={t.execucao === "No gatilho" ? "ok" : "warn"}>{t.execucao}</Pill>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
