import { createFileRoute } from "@tanstack/react-router";
import { Card, Field, PageTitle, Segmented, inputCls } from "@/components/app/ui";
import { useStore, type Ativo } from "@/lib/store";

export const Route = createFileRoute("/config")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Configurações · Agente Trader" },
      { name: "description", content: "Risco por trade, limite de stops e ativo padrão." },
      { property: "og:title", content: "Configurações · Agente Trader" },
      { property: "og:description", content: "Risco por trade, limite de stops e ativo padrão." },
    ],
  }),
  component: Config,
});

function Config() {
  const { config, setConfig } = useStore();
  return (
    <div>
      <PageTitle>Configurações</PageTitle>
      <Card className="space-y-4">
        <Field label="Risco por trade (R$)">
          <input type="number" inputMode="decimal" className={inputCls} value={config.riscoRs} onChange={(e) => setConfig({ ...config, riscoRs: Number(e.target.value) })} />
        </Field>
        <Field label="Limite de stops no dia">
          <input type="number" inputMode="numeric" min={1} className={inputCls} value={config.limiteStops} onChange={(e) => setConfig({ ...config, limiteStops: Math.max(1, Number(e.target.value)) })} />
        </Field>
        <Field label="Ativo padrão">
          <Segmented<Ativo> value={config.ativoPadrao} options={["WINZ26", "WDOZ26"]} onChange={(v) => setConfig({ ...config, ativoPadrao: v })} />
        </Field>
        <p className="text-xs text-muted-foreground">Salvo automaticamente neste aparelho.</p>
      </Card>
    </div>
  );
}
