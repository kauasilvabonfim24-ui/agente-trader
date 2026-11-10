import type { Trade } from "@/lib/store";

export type Desfecho = "Deu bom" | "Deu ruim" | "Empate";
export const desfecho = (t: Trade): Desfecho => (t.resultadoRs > 0 ? "Deu bom" : t.resultadoRs < 0 ? "Deu ruim" : "Empate");

export const FILTROS = ["Todos", "Deu bom", "Deu ruim", "No gatilho", "Antecipei"] as const;
export type Filtro = (typeof FILTROS)[number];
export function filtrar(trades: Trade[], f: Filtro) {
  if (f === "Todos") return trades;
  if (f === "Deu bom" || f === "Deu ruim") return trades.filter((t) => desfecho(t) === f);
  return trades.filter((t) => t.execucao === f);
}

const media = (l: (number | null)[]) => { const valores = l.filter((n): n is number => n !== null); return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null; };
export function estatisticas(trades: Trade[]) {
  return {
    total: trades.length,
    acerto: trades.length ? (trades.filter((t) => t.resultadoRs > 0).length / trades.length) * 100 : null,
    rMedio: media(trades.map((t) => t.resultadoR)),
    rGatilho: media(trades.filter((t) => t.execucao === "No gatilho").map((t) => t.resultadoR)),
    rAntecipei: media(trades.filter((t) => t.execucao === "Antecipei").map((t) => t.resultadoR)),
  };
}

// Motivo mais frequente entre os trades "Deu ruim" com execução "Antecipei" ou checklist não seguido.
export function erroMaisRepetido(trades: Trade[]): { motivo: string; vezes: number } | null {
  const ruins = trades.filter((t) => t.resultadoRs < 0);
  const c = [
    { motivo: "Antecipou a entrada", vezes: ruins.filter((t) => t.execucao === "Antecipei").length },
    { motivo: "Não seguiu o checklist", vezes: ruins.filter((t) => !t.seguiuChecklist).length },
  ].sort((a, b) => b.vezes - a.vezes)[0]!;
  return c.vezes > 0 ? c : null;
}

export const ordenar = (trades: Trade[]) => [...trades].sort((a, b) => b.dataHora.localeCompare(a.dataHora));
export const fmtR = (n: number | null) => (n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)} R`);
export const numeroOpcional = (valor: string) => valor.trim() === "" ? null : Number(valor);
export const mostrarNumero = (valor: number | null) => valor === null ? "-" : String(valor);
