import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageTitle, Pill } from "@/components/app/ui";
import { janelaFora, useStore } from "@/lib/store";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hoje · Agente Trader" },
      { name: "description", content: "Agenda de alto impacto, clima do dia e guarda de stops." },
      { property: "og:title", content: "Hoje · Agente Trader" },
      { property: "og:description", content: "Agenda de alto impacto, clima do dia e guarda de stops." },
    ],
  }),
  component: Hoje,
});

function Hoje() {
  const { eventos, noticias, trades, config, checklistHoje } = useStore();
  const altos = eventos.filter((e) => e.impacto === "Alto").sort((a, b) => a.hora.localeCompare(b.hora));
  const hoje = new Date().toISOString().slice(0, 10);
  const stops = trades.filter((t) => t.dataHora.startsWith(hoje) && t.resultadoRs < 0).length;
  const n = noticias[0]!;
  const noLimite = stops >= config.limiteStops;

  return (
    <div className="space-y-4">
      <PageTitle sub={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}>Hoje</PageTitle>

      <Card title="Agenda de alto impacto">
        {altos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento de alto impacto cadastrado.</p> : (
          <ul className="space-y-3">
            {altos.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-lg font-semibold">{e.hora}</span>
                <span className="flex-1">{e.nome} <span className="text-muted-foreground">· {e.pais}</span></span>
                <Pill tone="warn">{janelaFora(e.hora)}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Clima do dia">
        <ul className="space-y-1.5 text-sm">
          <li>Juros americanos em alta antes do Payroll: tende a subir o dólar.</li>
          <li>Medo no mundo com bolsas da Ásia em queda: pressão no índice.</li>
          <li>Risco Brasil elevado pelo debate fiscal: dólar firme, índice pressionado.</li>
        </ul>
        <p className="mt-3 text-sm font-medium text-warn">A reação só se confirma no gráfico.</p>
      </Card>

      <Card title="Notícia explicada">
        <h3 className="font-semibold">{n.titulo}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{n.resumo}</p>
        <p className="mt-2 text-sm"><span className="font-semibold">Costuma:</span> {n.costuma}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={n.fonte} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center rounded-lg border border-border text-sm font-medium">Ver fonte</a>
          <Link to="/agente" search={{ q: n.titulo }} className="flex min-h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">Perguntar ao agente</Link>
        </div>
      </Card>

      <Card title="Guarda do dia">
        <div className="flex items-center justify-between text-sm">
          <span>Stops hoje <b>{stops} de {config.limiteStops}</b></span>
          <Pill tone={noLimite ? "warn" : "ok"}>{noLimite ? "Limite atingido: parar" : "Dentro do limite"}</Pill>
        </div>
        <Progress value={Math.min(100, (stops / config.limiteStops) * 100)} className="mt-2 h-2" />
        <p className="mt-3 text-sm">Checklist <b>{checklistHoje} de 7</b></p>
      </Card>
    </div>
  );
}
