import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { PageTitle, inputCls } from "@/components/app/ui";

export const Route = createFileRoute("/agente")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: () => ({
    meta: [
      { title: "Agente · Agente Trader" },
      { name: "description", content: "Converse com o agente sobre o método e as notícias." },
      { property: "og:title", content: "Agente · Agente Trader" },
      { property: "og:description", content: "Converse com o agente sobre o método e as notícias." },
    ],
  }),
  component: Agente,
});

type Msg = { de: "eu" | "agente"; texto: string };

function responder(p: string) {
  const t = p.toLowerCase();
  if (t.includes("compr") || t.includes("vend")) return "Não faço recomendação. Posso conferir com você o checklist do método: tendência no 60, região no 15 e gatilho no 3.";
  if (t.includes("juros") || t.includes("payroll")) return "Dados fortes dos EUA costumam subir o dólar e pressionar o índice. Mas a reação só se confirma no gráfico, e perto do evento o método manda ficar fora.";
  return "Boa pergunta. Nesta versão sou um exemplo sem IA conectada, mas lembre: respeite o limite de stops e só entre no gatilho.";
}

function Agente() {
  const { q } = Route.useSearch();
  const [msgs, setMsgs] = useState<Msg[]>([{ de: "agente", texto: "Olá! Sou seu agente do método. Pergunte sobre notícias, checklist ou um trade." }]);
  const [txt, setTxt] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (q) setTxt(`Explique: ${q}`); }, [q]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const enviar = () => {
    if (!txt.trim()) return;
    setMsgs((m) => [...m, { de: "eu", texto: txt }, { de: "agente", texto: responder(txt) }]);
    setTxt("");
  };

  return (
    <div>
      <PageTitle sub="Exemplo local, sem IA conectada ainda">Agente</PageTitle>
      <div className="space-y-2">
        {msgs.map((m, i) => (
          <div key={i} className={m.de === "eu" ? "ml-10 rounded-[14px] bg-primary p-3 text-sm text-primary-foreground" : "mr-10 rounded-[14px] border border-border bg-card p-3 text-sm"}>
            {m.texto}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); enviar(); }} className="fixed inset-x-0 bottom-[92px] z-40 mx-auto flex max-w-xl gap-2 bg-background px-4 py-2">
        <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Pergunte algo…" className={inputCls} />
        <button aria-label="Enviar" className="flex w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Send className="h-5 w-5" /></button>
      </form>
    </div>
  );
}
