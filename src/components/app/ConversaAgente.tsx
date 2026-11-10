import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/app/ui";
import { conversar, erroAgente, PERGUNTAS_AGENTE, type MensagemAgente } from "@/lib/agent-chat";

export function ConversaAgente({ pergunta = "", compacto = false }: { pergunta?: string; compacto?: boolean }) {
  const [mensagens, setMensagens] = useState<MensagemAgente[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => { if (pergunta) setTexto(`Explique: ${pergunta}`); }, [pergunta]);
  useEffect(() => { if (caixa.current) caixa.current.scrollTop = caixa.current.scrollHeight; }, [mensagens, carregando]);
  async function enviar() {
    if (!texto.trim() || carregando) return;
    const novas: MensagemAgente[] = [...mensagens, { role: "user", content: texto.trim() }];
    setMensagens(novas); setTexto(""); setErro(null); setCarregando(true);
    try { const resposta = await conversar(novas); setMensagens([...novas, { role: "assistant", content: resposta }]); }
    catch (e) { setErro(erroAgente(e)); }
    finally { setCarregando(false); }
  }
  return <div className="space-y-3">
    <div ref={caixa} aria-live="polite" className={`${compacto ? "max-h-80" : "max-h-[50dvh] min-h-32"} space-y-2 overflow-y-auto`}>
      {!mensagens.length && <p className="text-sm text-muted-foreground">Olá! Vamos conversar sobre seus trades e seus dias?</p>}
      {mensagens.map((m, i) => <div key={i} className={`break-words whitespace-pre-wrap rounded-[14px] p-3 text-sm ${m.role === "user" ? "ml-6 bg-primary text-primary-foreground" : "mr-6 border border-border bg-card"}`}>{m.content}</div>)}
      {carregando && <p className="text-sm text-muted-foreground">Pensando...</p>}
    </div>
    {erro && <p role="alert" className="break-words rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">{erro}</p>}
    <div className="flex flex-wrap gap-2">{PERGUNTAS_AGENTE.map((p) => <Button key={p} variant="outline" type="button" className="h-auto min-h-11 max-w-full whitespace-normal text-left text-xs" onClick={() => setTexto(p)}>{p}</Button>)}</div>
    <form onSubmit={(e) => { e.preventDefault(); void enviar(); }} className="flex gap-2">
      <input aria-label="Mensagem ao agente" value={texto} onChange={(e) => setTexto(e.target.value)} className={inputCls} placeholder="Pergunte algo…" />
      <Button type="submit" aria-label="Enviar" title="Enviar" disabled={carregando || !texto.trim()} className="min-h-11 shrink-0"><Send /><span className="hidden sm:inline">Enviar</span></Button>
    </form>
  </div>;
}