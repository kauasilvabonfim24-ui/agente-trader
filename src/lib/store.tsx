import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dbReplace, dbSelect, supabaseConfigurado, useSession, userId } from "@/lib/supabase";

export type Ativo = "WINZ26" | "WDOZ26";
export type Impacto = "Alto" | "Médio" | "Baixo";
export type Evento = { id: string; data?: string; hora: string; nome: string; pais: string; impacto: Impacto };
export type Noticia = { id: string; titulo: string; resumo: string; costuma: string; fonte: string; hora: string };
export type Trade = {
  id: string; dataHora: string; ativo: Ativo; lado: "Compra" | "Venda"; alinhados: boolean;
  entrada: number | null; stop: number | null; alvo: number | null; saida: number | null; resultadoRs: number; resultadoR: number | null;
  seguiuChecklist: boolean; execucao: "No gatilho" | "Antecipei"; saidaAlvo: string;
  imagens?: string[] | null; notas?: string | null; leituraIa?: string | null;
};
export type Config = { riscoRs: number; limiteStops: number; ativoPadrao: Ativo };

export const PONTO_RS: Record<Ativo, number> = { WINZ26: 0.2, WDOZ26: 10 };

const hoje = new Date().toISOString().slice(0, 10);

const eventosIniciais: Evento[] = [
  { id: "00000000-0000-4000-8000-000000000001", data: hoje, hora: "09:00", nome: "IPCA (inflação Brasil)", pais: "BR", impacto: "Alto" },
  { id: "00000000-0000-4000-8000-000000000002", data: hoje, hora: "10:30", nome: "Payroll (emprego EUA)", pais: "EUA", impacto: "Alto" },
  { id: "00000000-0000-4000-8000-000000000003", data: hoje, hora: "12:00", nome: "Estoques de petróleo", pais: "EUA", impacto: "Médio" },
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
  syncErro: string | null;
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

const configPadrao: Config = { riscoRs: 15, limiteStops: 2, ativoPadrao: "WINZ26" };
const p2 = (n: number) => String(n).padStart(2, "0");
const toTrade = (t: Trade) => ({ id: t.id, user_id: userId(), data_hora: new Date(t.dataHora).toISOString(), ativo: t.ativo, lado: t.lado, alinhados: t.alinhados, entrada: t.entrada, stop: t.stop, alvo: t.alvo, saida: t.saida, resultado_rs: t.resultadoRs, resultado_r: t.resultadoR, seguiu_checklist: t.seguiuChecklist, execucao: t.execucao, saida_alvo: t.saidaAlvo, imagens: t.imagens ?? [], notas: t.notas ?? null, leitura_ia: t.leituraIa ?? null });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTrade = (r: any): Trade => { const d = new Date(r.data_hora); return { id: r.id, dataHora: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`, ativo: r.ativo, lado: r.lado, alinhados: r.alinhados, entrada: r.entrada == null ? null : +r.entrada, stop: r.stop == null ? null : +r.stop, alvo: r.alvo == null ? null : +r.alvo, saida: r.saida == null ? null : +r.saida, resultadoRs: +(r.resultado_rs ?? 0), resultadoR: r.resultado_r == null ? null : +r.resultado_r, seguiuChecklist: r.seguiu_checklist, execucao: r.execucao, saidaAlvo: r.saida_alvo ?? "", imagens: r.imagens ?? [], notas: r.notas ?? null, leituraIa: r.leitura_ia ?? null }; };
const toEvento = (e: Evento) => ({ id: e.id, user_id: userId(), data: e.data ?? new Date().toLocaleDateString("sv-SE"), hora: e.hora, nome: e.nome, pais: e.pais, impacto: e.impacto });

export function StoreProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const remoto = supabaseConfigurado && !!session;
  const [config, setConfig] = usePersist<Config>("at.config", configPadrao);
  const [eventos, setEventos] = usePersist("at.eventos", eventosIniciais);
  const [trades, setTrades] = usePersist("at.trades", tradesIniciais);
  const [checklistHoje, setChecklistHoje] = usePersist("at.checklist", 0);
  const [carregado, setCarregado] = useState(!remoto);
  const [syncErro, setSyncErro] = useState<string | null>(null);

  useEffect(() => {
    if (!remoto) { setCarregado(true); return; }
    let vivo = true;
    setCarregado(false);
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [s, e, j] = await Promise.all([dbSelect<any>("settings"), dbSelect<any>("events"), dbSelect<any>("journal")]);
        if (!vivo) return;
        setConfig(s[0] ? { riscoRs: +s[0].risco_rs, limiteStops: s[0].limite_stops, ativoPadrao: s[0].ativo_padrao } : configPadrao);
        setEventos(e.map((r) => ({ id: r.id, data: r.data, hora: r.hora, nome: r.nome, pais: r.pais, impacto: r.impacto })));
        setTrades(j.map(fromTrade));
        setSyncErro(null);
      } catch (err) { if (vivo) setSyncErro(err instanceof Error ? err.message : String(err)); }
      if (vivo) setCarregado(true);
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoto]);

  const erro = (e: unknown) => setSyncErro(e instanceof Error ? e.message : String(e));
  const salvaConfig = (c: Config) => { setConfig(c); if (remoto) dbReplace("settings", [{ user_id: userId(), risco_rs: c.riscoRs, limite_stops: c.limiteStops, ativo_padrao: c.ativoPadrao }], "user_id").catch(erro); };
  const salvaEventos = (l: Evento[]) => { setEventos(l); if (remoto) dbReplace("events", l.map(toEvento)).catch(erro); };
  const salvaTrades = (l: Trade[]) => { setTrades(l); if (remoto) dbReplace("journal", l.map(toTrade)).catch(erro); };

  return (
    <Ctx.Provider value={{ config, setConfig: salvaConfig, eventos, setEventos: salvaEventos, noticias: noticiasIniciais, trades, setTrades: salvaTrades, checklistHoje, setChecklistHoje, syncErro }}>
      {syncErro && <p className="bg-muted px-4 py-2 text-center text-xs text-warn">Erro ao sincronizar com o banco: {syncErro}</p>}
      {carregado ? children : <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider ausente");
  return c;
}

export function janelaFora(hora: string) {
  const [h = 0, m = 0] = hora.split(":").map(Number);
  const t = h * 60 + m;
  const f = (x: number) => `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
  return `Fora ${f(t - 10)} a ${f(t + 20)}`;
}

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));

export function stopsHoje(trades: Trade[]) {
  const hoje = new Date().toLocaleDateString("sv-SE");
  return trades.filter((t) => t.dataHora.startsWith(hoje) && t.resultadoRs < 0).length;
}

// true se agora estiver dentro da janela (10 min antes a 20 min depois) de um evento de alto impacto
export function dentroJanelaNoticia(eventos: Evento[], agora = new Date()) {
  const n = agora.getHours() * 60 + agora.getMinutes();
  return eventos.some((e) => {
    if (e.impacto !== "Alto") return false;
    const [h = 0, m = 0] = e.hora.split(":").map(Number);
    const t = h * 60 + m;
    return n >= t - 10 && n <= t + 20;
  });
}
