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

type Msg = { de: "eu" | "agente"; texto: string };

// Resumo curto do diário, calculado aqui (a IA só usa para citar padrões reais)
function resumoHistorico(trades: Trade[], stops: number, limite: number) {
  const partes = [`Stops de hoje: ${stops} de ${limite}.`];
  if (trades.length) {
    const positivos = trades.filter((t) => t.resultadoRs > 0).length;
    const negativos = trades.filter((t) => t.resultadoRs < 0).length;
    const total = trades.reduce((soma, t) => soma + t.resultadoRs, 0);
    const antecipou = trades.filter((t) => t.execucao === "Antecipei").length;
    const semChecklist = trades.filter((t) => !t.seguiuChecklist).length;
    partes.push(
      `${trades.length} trades no diário: ${positivos} positivos e ${negativos} negativos, resultado total de R$ ${total.toFixed(2)}. Antecipou a vela em ${antecipou}. Não seguiu o checklist em ${semChecklist}.`,
    );
  }
  return partes.join(" ");
}

function Agente() {
  const { q } = Route.useSearch();
  const { trades, config } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([{ de: "agente", texto: "Olá! Sou seu agente do método. Pergunte sobre notícias, checklist ou um trade." }]);
  const [txt, setTxt] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (q) setTxt(`Explique: ${q}`); }, [q]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, carregando, erro]);

  const enviar = async () => {
    const pergunta = txt.trim();
    if (!pergunta || carregando) return;
    const novas: Msg[] = [...msgs, { de: "eu", texto: pergunta }];
    setMsgs(novas);
    setTxt("");
    setErro(null);
    setCarregando(true);
    try {
      const r = await chamarFuncao<{ resposta: string }>("agente", {
        mensagens: novas.slice(-10),
        historico: resumoHistorico(trades, stopsHoje(trades), config.limiteStops),
      });
      setMsgs((m) => [...m, { de: "agente", texto: r.resposta }]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div>
      <PageTitle sub="Conversa educativa sobre o método, nunca recomendação">Agente</PageTitle>
      <div className="space-y-2 pb-20">
        {msgs.map((m, i) => (
          <div key={i} className={m.de === "eu" ? "ml-10 whitespace-pre-wrap rounded-[14px] bg-primary p-3 text-sm text-primary-foreground" : "mr-10 whitespace-pre-wrap rounded-[14px] border border-border bg-card p-3 text-sm"}>
            {m.texto}
          </div>
        ))}
        {carregando && <div className="mr-10 rounded-[14px] border border-border bg-card p-3 text-sm text-muted-foreground">Pensando...</div>}
        {erro && <p className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">{erro}</p>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void enviar(); }} className="fixed inset-x-0 bottom-[92px] z-40 mx-auto flex max-w-xl gap-2 bg-background px-4 py-2">
        <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Pergunte algo…" className={inputCls} />
        <button aria-label="Enviar" disabled={carregando} className="flex w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"><Send className="h-5 w-5" /></button>
      </form>
    </div>
  );
}
