import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase", () => ({ chamarFuncao: vi.fn(), dbSelect: vi.fn(), salvarDia: vi.fn(), useSession: vi.fn() }));
import { chamarFuncao } from "@/lib/supabase";
import { estatisticasDias, prepararDia, type DayLog } from "@/lib/days";
import { conversar, erroAgente, type MensagemAgente } from "@/lib/agent-chat";
import { numeroOpcional } from "@/lib/trades";
const dia = (p: Partial<DayLog> = {}): DayLog => ({ id: "a", data: "2026-11-10", estado: "Calmo", concentracao: 4, resultado_rs: null, stops: 0, ativos: null, notas: null, ...p });
describe("Regras do registro rápido e Meus Dias", () => {
  it("campo vazio vira null, mas zero preenchido continua zero", () => { expect(numeroOpcional("")).toBeNull(); expect(numeroOpcional("0")).toBe(0); });
  it("reutiliza o id da mesma data", () => { expect(prepararDia(dia({ id: "novo" }), [dia({ id: "existente" })]).id).toBe("existente"); });
  it("concentração aceita somente inteiros de 1 a 5", () => {
    for (const n of [0, 6, 1.5]) expect(() => prepararDia(dia({ concentracao: n }), [])).toThrow();
    for (const n of [1, 5]) expect(prepararDia(dia({ concentracao: n }), []).concentracao).toBe(n);
  });
  it("soma apenas os últimos 10 dias registrados", () => {
    const dias = Array.from({ length: 11 }, (_, i) => dia({ data: `2026-11-${String(i + 1).padStart(2, "0")}`, resultado_rs: i === 0 ? 1000 : 10 }));
    expect(estatisticasDias(dias).ultimos10).toBe(100); expect(estatisticasDias(dias).total).toBe(11);
  });
  it("compara médias 4–5 e 1–3 sem tratar check-in aberto como zero", () => {
    expect(estatisticasDias([dia({ resultado_rs: 20 }), dia({ concentracao: 5, resultado_rs: 40 }), dia(), dia({ concentracao: 1, resultado_rs: -10 }), dia({ concentracao: 3, resultado_rs: 10 })])).toMatchObject({ alta: 30, baixa: 0 });
  });
});
describe("Contrato do chat", () => {
  it("envia as últimas 12 mensagens ao agente-chat", async () => {
    const mensagens: MensagemAgente[] = Array.from({ length: 14 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: String(i) }));
    vi.mocked(chamarFuncao).mockResolvedValue({ resposta: "Resposta real" });
    expect(await conversar(mensagens)).toBe("Resposta real");
    expect(chamarFuncao).toHaveBeenCalledWith("agente-chat", { mensagens: mensagens.slice(2) });
  });
  it("explica a ausência do segredo do Gemini", () => { expect(erroAgente(new Error("GEMINI_API_KEY não configurada"))).toContain("O segredo do Gemini ainda não foi configurado no Supabase"); });
});