import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { dbSelect, salvarDia, useSession } from "@/lib/supabase";

export const ESTADOS = ["Calmo", "Ansioso", "Com medo", "Distraído", "Cansado"] as const;
export type DayLog = { id: string; data: string; estado: string; concentracao: number; resultado_rs: number | null; stops: number; ativos: string | null; notas: string | null };
export const dataLocal = () => new Date().toLocaleDateString("sv-SE");
export function estatisticasDias(dias: DayLog[]) {
  const lista = [...dias].sort((a, b) => b.data.localeCompare(a.data));
  const media = (grupo: DayLog[]) => {
    const valores = grupo.flatMap((d) => d.resultado_rs === null ? [] : [d.resultado_rs]);
    return valores.length ? valores.reduce((s, n) => s + n, 0) / valores.length : null;
  };
  return { total: lista.length, ultimos10: lista.slice(0, 10).reduce((s, d) => s + (d.resultado_rs ?? 0), 0), alta: media(lista.filter((d) => d.concentracao >= 4)), baixa: media(lista.filter((d) => d.concentracao <= 3)) };
}
export function prepararDia(dia: DayLog, existentes: DayLog[]) {
  if (!Number.isInteger(dia.concentracao) || dia.concentracao < 1 || dia.concentracao > 5) throw new Error("Escolha uma concentração de 1 a 5.");
  if (!Number.isInteger(dia.stops) || dia.stops < 0) throw new Error("Informe um número inteiro de stops, a partir de zero.");
  return { ...dia, id: existentes.find((d) => d.data === dia.data)?.id ?? dia.id };
}
export function useDias() {
  const session = useSession();
  const client = useQueryClient();
  const options = queryOptions({ queryKey: ["day_log", session?.user_id], queryFn: () => dbSelect<DayLog>("day_log"), enabled: !!session });
  const query = useQuery(options);
  return { dias: query.data ?? [], carregando: query.isPending && !!session, erro: query.error, tentar: query.refetch, salvar: async (dia: DayLog) => {
    if (!session) throw new Error("Entre na sua conta para salvar o check-in.");
    await salvarDia(prepararDia(dia, query.data ?? []));
    await client.invalidateQueries({ queryKey: options.queryKey });
  } };
}