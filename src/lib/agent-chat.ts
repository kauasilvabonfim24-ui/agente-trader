import { chamarFuncao } from "@/lib/supabase";

export type MensagemAgente = { role: "user" | "assistant"; content: string };
export const PERGUNTAS_AGENTE = ["Qual o meu erro mais repetido?", "Compare meus trades no gatilho e antecipados", "Como foi minha semana?", "O que anotei nos dias ruins?"];
export const mensagensRecentes = (mensagens: MensagemAgente[]) => mensagens.slice(-12);
export function erroAgente(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  return /(?:falta|missing|not configured|não configurad|ausente|not set).*(?:chave|key|gemini|secret)|(?:chave|key|gemini|secret).*(?:falta|missing|não configurad|ausente|not configured|not set)/i.test(mensagem)
    ? "O segredo do Gemini ainda não foi configurado no Supabase. Configure-o na função agente-chat para conversar com o agente."
    : `Não consegui responder agora. ${mensagem}`;
}
export async function conversar(mensagens: MensagemAgente[]) {
  const retorno = await chamarFuncao<{ resposta: string }>("agente-chat", { mensagens: mensagensRecentes(mensagens) });
  if (!retorno || typeof retorno.resposta !== "string") throw new Error("O agente não retornou uma resposta. Tente novamente.");
  return retorno.resposta;
}