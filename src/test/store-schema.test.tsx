import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreProvider, useStore } from "@/lib/store";

const mocks = vi.hoisted(() => ({ select: vi.fn(), replace: vi.fn(), session: { user_id: "11111111-1111-4111-8111-111111111111" } }));
vi.mock("@/lib/supabase", () => ({
  dbSelect: mocks.select, dbReplace: mocks.replace, supabaseConfigurado: true,
  useSession: () => mocks.session, userId: () => mocks.session.user_id,
}));

let store: ReturnType<typeof useStore>;
function Probe() { store = useStore(); return <span>Pronto</span>; }

const event = { id: "22222222-2222-4222-8222-222222222222", user_id: mocks.session.user_id, data: "2026-11-07", hora: "10:30", nome: "Payroll", pais: "EUA", impacto: "Alto" };
const trade = { id: "33333333-3333-4333-8333-333333333333", user_id: mocks.session.user_id, data_hora: "2026-11-07T12:30:00.000Z", ativo: "WINZ26", lado: "Compra", alinhados: true, entrada: 100, stop: 90, alvo: 120, saida: 120, resultado_rs: 4, resultado_r: 2, seguiu_checklist: true, execucao: "No gatilho", saida_alvo: "Saiu no alvo", imagens: ["11111111-1111-4111-8111-111111111111/print.png"], notas: "Registro pessoal", leitura_ia: "Leitura registrada" };

beforeEach(() => {
  localStorage.clear();
  mocks.replace.mockReset().mockResolvedValue(undefined);
  mocks.select.mockReset().mockImplementation(async (table: string) => table === "events" ? [event] : table === "journal" ? [trade] : []);
});

async function ready() {
  const result = render(<StoreProvider><Probe /></StoreProvider>);
  await waitFor(() => expect(result.getByText("Pronto")).toBeDefined());
  return result;
}

describe("Alinhamento com as colunas do banco existente", () => {
  it("inclui user_id ao enviar journal", async () => {
    const view = await ready();
    act(() => store.setTrades(store.trades));
    expect(mocks.replace).toHaveBeenCalledWith("journal", [expect.objectContaining({ user_id: mocks.session.user_id })]);
    view.unmount();
  });

  it("preserva imagens, notas e leitura_ia no ciclo de leitura e gravação", async () => {
    const view = await ready();
    expect(store.trades[0]).toMatchObject({ imagens: trade.imagens, notas: trade.notas, leituraIa: trade.leitura_ia });
    act(() => store.setTrades(store.trades));
    expect(mocks.replace).toHaveBeenCalledWith("journal", [expect.objectContaining({ imagens: trade.imagens, notas: trade.notas, leitura_ia: trade.leitura_ia })]);
    view.unmount();
  });

  it("preserva data e inclui user_id ao enviar events", async () => {
    const view = await ready();
    expect(store.eventos[0]?.data).toBe("2026-11-07");
    act(() => store.setEventos(store.eventos));
    expect(mocks.replace).toHaveBeenCalledWith("events", [event]);
    view.unmount();
  });

  it("preenche data para eventos antigos locais sem data", async () => {
    const view = await ready();
    const { data: _data, user_id: _user, ...legacy } = event;
    act(() => store.setEventos([legacy]));
    expect(mocks.replace).toHaveBeenCalledWith("events", [expect.objectContaining({ data: new Date().toLocaleDateString("sv-SE"), user_id: mocks.session.user_id })]);
    view.unmount();
  });

  it("mantém o mapeamento de settings alinhado", async () => {
    const view = await ready();
    act(() => store.setConfig({ riscoRs: 15, limiteStops: 2, ativoPadrao: "WINZ26" }));
    expect(mocks.replace).toHaveBeenCalledWith("settings", [{ user_id: mocks.session.user_id, risco_rs: 15, limite_stops: 2, ativo_padrao: "WINZ26" }], "user_id");
    view.unmount();
  });
});