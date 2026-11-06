import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Ativo = "WINZ26" | "WDOZ26";
export type Impacto = "Alto" | "Médio" | "Baixo";
export type Evento = { id: string; hora: string; nome: string; pais: string; impacto: Impacto };
export type Noticia = { id: string; titulo: string; resumo: string; costuma: string; fonte: string; hora: string };
export type Trade = {
  id: string; dataHora: string; ativo: Ativo; lado: "Compra" | "Venda"; alinhados: boolean;
  entrada: number; stop: number; alvo: number; saida: number; resultadoRs: number; resultadoR: number;
  seguiuChecklist: boolean; execucao: "No gatilho" | "Antecipei"; saidaAlvo: string;
};
export type Config = { riscoRs: number; limiteStops: number; ativoPadrao: Ativo };

export const PONTO_RS: Record<Ativo, number> = { WINZ26: 0.2, WDOZ26: 10 };

const hoje = new Date().toISOString().slice(0, 10);

const eventosIniciais: Evento[] = [
  { id: "e1", hora: "09:00", nome: "IPCA (inflação Brasil)", pais: "BR", impacto: "Alto" },
  { id: "e2", hora: "10:30", nome: "Payroll (emprego EUA)", pais: "EUA", impacto: "Alto" },
  { id: "e3", hora: "12:00", nome: "Estoques de petróleo", pais: "EUA", impacto: "Médio" },
];

const noticiasIniciais: Noticia[] = [
  { id: "n1", hora: "07:30", titulo: "Juros dos títulos americanos sobem antes do Payroll", resumo: "O mercado espera dados de emprego fortes nos EUA, o que pode manter os juros altos por mais tempo.", costuma: "subir o dólar e pressionar o índice.", fonte: "https://www.reuters.com" },
  { id: "n2", hora: "06:50", titulo: "Bolsas da Ásia fecham em queda", resumo: "Aversão a risco global após tensão comercial entre grandes economias.", costuma: "aumentar a procura por dólar.", fonte: "https://www.bloomberg.com" },
  { id: "n3", hora: "06:10", titulo: "Debate fiscal em Brasília segue sem definição", resumo: "Investidores aguardam sinais sobre as contas públicas.", costuma: "elevar o risco Brasil e pressionar o índice.", fonte: "https://valor.globo.com" },
];

const tradesIniciais: Trade[] = [
  { id: "t1", dataHora: `${hoje}T09:45`, ativo: "WINZ26", lado: "Compra", alinhados: true, entrada: 128500, stop: 128350, alvo: 128800, saida: 128800, resultadoRs: 60, resultadoR: 2, seguiuChecklist: true, execucao: "No gatilho", saidaAlvo: "Saiu no alvo" },
  { id: "t2", dataHora: `${hoje}T11:10`, ativo: "WINZ26", lado: "Venda", alinhados: false, entrada: 128700, stop: 128850, alvo: 128400, saida: 128850, resultadoRs: -30, resultadoR: -1, seguiuChecklist: false, execucao: "Antecipei", saidaAlvo: "Teria batido o alvo depois" },
];

type Store = {
  config: Config; setConfig: (c: Config) => void;
  eventos: Evento[]; setEventos: (e: Evento[]) => void;
  noticias: Noticia[];
  trades: Trade[]; setTrades: (t: Trade[]) => void;
  checklistHoje: number; setChecklistHoje: (n: number) => void;
};

const Ctx = createContext<Store | null>(null);

function usePersist<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try { const r = localStorage.getItem(key); if (r) setV(JSON.parse(r)); } catch { /* ignore */ }
  }, [key]);
  const set = (nv: T) => { setV(nv); try { localStorage.setItem(key, JSON.stringify(nv)); } catch { /* ignore */ } };
  return [v, set];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = usePersist<Config>("at.config", { riscoRs: 15, limiteStops: 2, ativoPadrao: "WINZ26" });
  const [eventos, setEventos] = usePersist("at.eventos", eventosIniciais);
  const [trades, setTrades] = usePersist("at.trades", tradesIniciais);
  const [checklistHoje, setChecklistHoje] = usePersist("at.checklist", 0);
  return (
    <Ctx.Provider value={{ config, setConfig, eventos, setEventos, noticias: noticiasIniciais, trades, setTrades, checklistHoje, setChecklistHoje }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider ausente");
  return c;
}

export function janelaFora(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  const t = h * 60 + m;
  const f = (x: number) => `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
  return `Fora ${f(t - 10)} a ${f(t + 20)}`;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
