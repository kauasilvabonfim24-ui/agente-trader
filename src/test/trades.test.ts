import { describe, expect, it } from "vitest";
import { desfecho, erroMaisRepetido, estatisticas, filtrar } from "@/lib/trades";
import type { Trade } from "@/lib/store";

const t = (p: Partial<Trade>): Trade => ({ id: "x", dataHora: "2026-11-01T10:00", ativo: "WINZ26", lado: "Compra", alinhados: true, entrada: 1, stop: 1, alvo: 1, saida: 1, resultadoRs: 0, resultadoR: 0, seguiuChecklist: true, execucao: "No gatilho", saidaAlvo: "", ...p });

describe("trades", () => {
  it("não inclui R ausente nas médias", () => {
    expect(estatisticas([t({ resultadoR: null }), t({ resultadoR: 2 })]).rMedio).toBe(2);
  });
  it("desfecho: >0 deu bom, <0 deu ruim, 0 empate", () => {
    expect(desfecho(t({ resultadoRs: 5 }))).toBe("Deu bom");
    expect(desfecho(t({ resultadoRs: -5 }))).toBe("Deu ruim");
    expect(desfecho(t({ resultadoRs: 0 }))).toBe("Empate");
  });
  it("filtro Antecipei", () => {
    expect(filtrar([t({ execucao: "Antecipei" }), t({})], "Antecipei")).toHaveLength(1);
  });
  it("estatísticas", () => {
    const s = estatisticas([t({ resultadoRs: 10, resultadoR: 2 }), t({ resultadoRs: -5, resultadoR: -1, execucao: "Antecipei" })]);
    expect(s.acerto).toBe(50);
    expect(s.rGatilho).toBe(2);
    expect(s.rAntecipei).toBe(-1);
  });
  it("erro mais repetido só conta trades Deu ruim", () => {
    expect(erroMaisRepetido([t({ resultadoRs: 10, execucao: "Antecipei" })])).toBeNull();
    expect(erroMaisRepetido([t({ resultadoRs: -1, seguiuChecklist: false })])?.motivo).toBe("Não seguiu o checklist");
  });
});
