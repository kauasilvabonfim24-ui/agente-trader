import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Card, Field, PageTitle, Pill, Segmented, inputCls } from "@/components/app/ui";
import { PONTO_RS, useStore, type Ativo } from "@/lib/store";

export const Route = createFileRoute("/analisar")({
  head: () => ({
    meta: [
      { title: "Analisar · Agente Trader" },
      { name: "description", content: "Envie os prints e veja o veredito do método." },
      { property: "og:title", content: "Analisar · Agente Trader" },
      { property: "og:description", content: "Envie os prints e veja o veredito do método." },
    ],
  }),
  component: Analisar,
});

const SLOTS = [
  { id: "60", label: "60 min", dica: "MME 200" },
  { id: "15", label: "15 min", dica: "MME 50, topos, fundos e regiões" },
  { id: "3", label: "3 min", dica: "MME 5, 9 e 21" },
] as const;

type Resp = "Sim" | "Não" | "Não deu pra ver";
const ITENS = [
  "Preço do lado certo da MME 200 no 60 min",
  "MME 50 no 15 min apontando na mesma direção",
  "Preço em região de topo/fundo relevante no 15 min",
  "MMEs 5, 9 e 21 alinhadas no 3 min",
  "Gatilho de entrada formado no 3 min",
  "Fora da janela de notícia de alto impacto",
  "Alvo pelo menos 1,5x o stop",
];

function Analisar() {
  const { config, setChecklistHoje } = useStore();
  const [ativo, setAtivo] = useState<Ativo>(config.ativoPadrao);
  const [prints, setPrints] = useState<Record<string, string>>({});
  const [entrada, setEntrada] = useState(""); const [stop, setStop] = useState(""); const [alvo, setAlvo] = useState("");
  const [res, setRes] = useState<null | { veredito: string; motivo: string; tone: "ok" | "warn"; check: Resp[] }>(null);
  const [verIA, setVerIA] = useState(false);
  const [marcar, setMarcar] = useState<string | null>(null);

  useEffect(() => setAtivo(config.ativoPadrao), [config.ativoPadrao]);

  const e = +entrada, s = +stop, a = +alvo;
  const ptsStop = Math.abs(e - s), ptsAlvo = Math.abs(a - e);
  const rr = ptsStop ? ptsAlvo / ptsStop : 0;

  const analisar = () => {
    const temTodos = SLOTS.every((x) => prints[x.id]);
    const compra = a > e && s < e, venda = a < e && s > e;
    const check: Resp[] = ITENS.map((_, i) => {
      if (i === 6) return rr >= 1.5 ? "Sim" : ptsStop ? "Não" : "Não deu pra ver";
      if (!prints[SLOTS[Math.min(2, Math.floor(i / 2))].id]) return "Não deu pra ver";
      return (["Sim", "Sim", "Não deu pra ver", "Sim", "Sim", "Sim"] as Resp[])[i];
    });
    setChecklistHoje(check.filter((c) => c === "Sim").length);
    if (!temTodos) return setRes({ veredito: "Fora por enquanto", motivo: "Faltam prints: o método precisa dos 3 tempos gráficos.", tone: "warn", check });
    if (!compra && !venda) return setRes({ veredito: "Fora por enquanto", motivo: "Entrada, stop e alvo não formam um plano coerente.", tone: "warn", check });
    if (rr < 1.5) return setRes({ veredito: "Fora por enquanto", motivo: `Relação alvo/stop de ${rr.toFixed(1)}: abaixo de 1,5.`, tone: "warn", check });
    if (check.includes("Não")) return setRes({ veredito: "Fora por enquanto", motivo: "Há item do checklist com resposta Não.", tone: "warn", check });
    setRes({ veredito: compra ? "Compra possível" : "Venda possível", motivo: "Tempos alinhados e relação alvo/stop adequada. Confirme o gatilho antes.", tone: "ok", check });
  };

  return (
    <div className="space-y-4">
      <PageTitle sub="Veredito do método, nunca recomendação">Analisar</PageTitle>
      <Segmented<Ativo> value={ativo} options={["WINZ26", "WDOZ26"]} onChange={setAtivo} />

      <Card title="Prints">
        <div className="grid grid-cols-3 gap-2">
          {SLOTS.map((sl) => (
            <div key={sl.id} className="flex flex-col gap-1">
              <label className="relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-background text-center">
                {prints[sl.id] ? <img src={prints[sl.id]} alt={`Print ${sl.label}`} className="h-full w-full object-cover" /> : (
                  <><ImagePlus className="h-6 w-6 text-muted-foreground" /><span className="mt-1 text-sm font-semibold">{sl.label}</span></>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={(ev) => {
                  const file = ev.target.files?.[0]; if (!file) return;
                  setPrints((p) => ({ ...p, [sl.id]: URL.createObjectURL(file) }));
                }} />
              </label>
              <span className="text-[11px] leading-tight text-muted-foreground">{sl.label}: {sl.dica}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Plano">
        <div className="grid grid-cols-3 gap-2">
          <Field label="Entrada"><input type="number" inputMode="decimal" className={inputCls} value={entrada} onChange={(x) => setEntrada(x.target.value)} /></Field>
          <Field label="Stop"><input type="number" inputMode="decimal" className={inputCls} value={stop} onChange={(x) => setStop(x.target.value)} /></Field>
          <Field label="Alvo"><input type="number" inputMode="decimal" className={inputCls} value={alvo} onChange={(x) => setAlvo(x.target.value)} /></Field>
        </div>
        <button onClick={analisar} className="mt-3 w-full rounded-lg bg-primary font-semibold text-primary-foreground">Analisar</button>
      </Card>

      {res && (
        <>
          <Card title="Veredito do método">
            <Pill tone={res.tone}>{res.tone === "ok" ? "✓ " : "! "}{res.veredito}</Pill>
            <p className="mt-2 text-sm text-muted-foreground">{res.motivo}</p>
          </Card>

          <Card title={`Checklist ${res.check.filter((c) => c === "Sim").length} de 7`}>
            <ul className="space-y-2">
              {ITENS.map((it, i) => (
                <li key={it} className="flex items-start justify-between gap-2 text-sm">
                  <span>{it}</span>
                  <Pill tone={res.check[i] === "Sim" ? "ok" : res.check[i] === "Não" ? "warn" : "muted"}>{res.check[i]}</Pill>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Plano hipotético">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Stop</dt><dd>{ptsStop} pts · R$ {(ptsStop * PONTO_RS[ativo]).toFixed(2)}</dd>
              <dt className="text-muted-foreground">Alvo</dt><dd>{ptsAlvo} pts · R$ {(ptsAlvo * PONTO_RS[ativo]).toFixed(2)}</dd>
              <dt className="text-muted-foreground">Risco</dt><dd>1 R = R$ {config.riscoRs} · alvo = {rr.toFixed(2)} R</dd>
              <dt className="text-muted-foreground">Contratos p/ risco</dt><dd>{ptsStop ? Math.max(0, Math.floor(config.riscoRs / (ptsStop * PONTO_RS[ativo]))) : "–"}</dd>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">Valores por 1 contrato. Hipotético e educativo.</p>
          </Card>

          <button onClick={() => setVerIA(!verIA)} className="w-full rounded-lg border border-border font-medium">{verIA ? "Ocultar" : "Ver o que a IA enxergou"}</button>
          {verIA && (
            <Card title="O que a IA enxergou (exemplo)">
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>60 min: preço {prints["60"] ? "acima da MME 200" : "sem print"}.</li>
                <li>15 min: {prints["15"] ? "MME 50 inclinada, região de fundo recente próxima" : "sem print"}.</li>
                <li>3 min: {prints["3"] ? "MMEs 5, 9 e 21 abertas em leque" : "sem print"}.</li>
              </ul>
            </Card>
          )}
        </>
      )}

      <Card title="Marcar no print">
        <div className="flex gap-2">
          {SLOTS.map((sl) => (
            <button key={sl.id} disabled={!prints[sl.id]} onClick={() => setMarcar(sl.id)} className="flex-1 rounded-lg border border-border text-sm disabled:opacity-40">{sl.label}</button>
          ))}
        </div>
        {!Object.keys(prints).length && <p className="mt-2 text-xs text-muted-foreground">Envie um print para marcar.</p>}
      </Card>
      {marcar && prints[marcar] && <Marcador src={prints[marcar]} onClose={() => setMarcar(null)} />}

      <Contexto />
    </div>
  );
}

const MARCAS = [
  { k: "Entrada", cor: "var(--foreground)" },
  { k: "Stop", cor: "var(--warn)" },
  { k: "Alvo", cor: "var(--ok)" },
];

function Marcador({ src, onClose }: { src: string; onClose: () => void }) {
  const [ys, setYs] = useState<number[]>([]);
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm">{ys.length < 3 ? <>Toque para marcar: <b>{MARCAS[ys.length].k}</b></> : "Pronto!"}</p>
        <div className="flex gap-2">
          <button onClick={() => setYs([])} className="rounded-lg border border-border px-3 text-sm">Limpar</button>
          <button onClick={onClose} aria-label="Fechar" className="flex w-11 items-center justify-center rounded-lg border border-border"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="relative flex-1 overflow-auto">
        <div className="relative" onClick={(e) => {
          if (ys.length >= 3) return;
          const r = e.currentTarget.getBoundingClientRect();
          setYs([...ys, ((e.clientY - r.top) / r.height) * 100]);
        }}>
          <img src={src} alt="Print para marcar" className="w-full select-none" draggable={false} />
          {ys.map((y, i) => (
            <div key={i} className="pointer-events-none absolute inset-x-0" style={{ top: `${y}%` }}>
              <div className="border-t-2 border-dashed" style={{ borderColor: MARCAS[i].cor }} />
              <span className="absolute right-1 -top-6 rounded bg-background/80 px-1.5 text-xs font-semibold" style={{ color: MARCAS[i].cor }}>{MARCAS[i].k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Contexto() {
  const [aberto, setAberto] = useState(false);
  const [simbolo, setSimbolo] = useState("BMFBOVESPA:WIN1!");
  const [aplicado, setAplicado] = useState(simbolo);
  const [erro, setErro] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto || !ref.current) return;
    const el = ref.current;
    el.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%"></div>';
    setErro(false);
    const sc = document.createElement("script");
    sc.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    sc.async = true;
    sc.onerror = () => setErro(true);
    sc.innerHTML = JSON.stringify({ symbol: aplicado, interval: "15", theme: "dark", locale: "br", autosize: true, hide_side_toolbar: true, backgroundColor: "#0B0F14" });
    el.appendChild(sc);
    const t = setTimeout(() => { if (!el.querySelector("iframe")) setErro(true); }, 8000);
    return () => clearTimeout(t);
  }, [aberto, aplicado]);

  return (
    <Card title="Contexto (opcional)" action={<button onClick={() => setAberto(!aberto)} className="rounded-lg border border-border px-3 text-sm">{aberto ? "Fechar" : "Abrir"}</button>}>
      <Pill tone="warn">atrasado 15 min: só contexto, nunca pra entrar</Pill>
      {aberto && (
        <div className="mt-3 space-y-2">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setAplicado(simbolo.trim()); }}>
            <input className={inputCls} value={simbolo} onChange={(e) => setSimbolo(e.target.value)} aria-label="Símbolo" />
            <button className="rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Ok</button>
          </form>
          {erro && <p className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">Não consegui carregar o gráfico agora. Confira o símbolo ou sua conexão — tudo bem, ele é só contexto.</p>}
          <div ref={ref} className="tradingview-widget-container h-80 overflow-hidden rounded-lg" />
        </div>
      )}
    </Card>
  );
}
