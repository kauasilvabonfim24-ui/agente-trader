import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/app/ui";
import { ConversaAgente } from "@/components/app/ConversaAgente";

export const Route = createFileRoute("/agente")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Agente · Agente Trader" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Converse com o agente sobre o método e as notícias." },
      { property: "og:title", content: "Agente · Agente Trader" },
      { property: "og:description", content: "Converse com o agente sobre o método e as notícias." },
    ],
  }),
  component: Agente,
});

function Agente() {
  const { q } = Route.useSearch();
  return <div className="space-y-4"><PageTitle>Agente</PageTitle><ConversaAgente pergunta={q} /></div>;
}
