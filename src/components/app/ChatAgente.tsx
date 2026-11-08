import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Card, inputCls } from "@/components/app/ui";
import { dentroJanelaNoticia, stopsHoje, useStore, type Evento, type Trade } from "@/lib/store";
import { chamarFuncao } from "@/lib/supabase";

type Msg = { de: "eu" | "agente"; texto: string };

const SUGESTOES = ["Meu gatilho está valendo?", "Revisar meu stop e alvo", "Tem notícia mexendo agora?"];

// Contexto curto do dia, calculado aqui (a IA só usa para citar fatos reais)
function contexto(trades: Trade[], eventos: Evento[], stops: number, limite: number) {
  const partes = [`Stops de hoje: ${stops} de ${limite}.`];
  partes.push(dentroJanelaNoticia(eventos) ? "AGORA está dentro de uma janela de notícia (10 min antes a 20 min depois)." : "Agora está fora de janela de notícia.");
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
  const altos = eventos.filter((e) => e.impacto === "Alto");
  if (altos.length) partes.push(`Eventos de alto impacto cadastrados: ${altos.map((e) => `${e.hora} ${e.nome.slice(0, 60)} (${e.pais})`).join("; ")}.`);
  return partes.join(" ");
}

// Chat compacto para ficar junto do gráfico (a tela "Agente" continua com a conversa em tela cheia)
export function ChatAgente() {
  const { trades, config, eventos } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([
    { de: "agente", texto: "Olá! Conte a ideia de entrada ou a dúvida do trade. Eu avalio pelo método, sem recomendar compra ou venda." },
  ]);
  const [txt, setTxt] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  // rola só a caixa de mensagens (nunca a página inteira)
  useEffect(() => {
    const c = caixa.current;
    if (c) c.scrollTop = c.scrollHeight;
  }, [msgs, carregando, erro]);

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
        historico: contexto(trades, eventos, stopsHoje(trades), config.limiteStops),
      });
      setMsgs((m) => [...m, { de: "agente", texto: r.resposta }]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Card title="Converse com o agente">
      <div ref={caixa} className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <div key={i} className={m.de === "eu" ? "ml-8 whitespace-pre-wrap rounded-[14px] bg-primary p-3 text-sm text-primary-foreground" : "mr-8 whitespace-pre-wrap rounded-[14px] border border-border bg-background p-3 text-sm"}>
            {m.texto}
          </div>
        ))}
        {carregando && <div className="mr-8 rounded-[14px] border border-border bg-background p-3 text-sm text-muted-foreground">Pensando...</div>}
        {erro && <p className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">{erro}</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGESTOES.map((s) => (
          <button key={s} type="button" onClick={() => setTxt(s)} className="min-h-9 rounded-full border border-border px-3 text-xs text-muted-foreground">{s}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void enviar(); }} className="mt-2 flex gap-2">
        <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Pergunte sobre a entrada…" className={inputCls} />
        <button aria-label="Enviar" disabled={carregando} className="flex w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"><Send className="h-5 w-5" /></button>
      </form>
    </Card>
  );
}
