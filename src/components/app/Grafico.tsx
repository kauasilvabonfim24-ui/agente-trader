import { useEffect, useRef, useState } from "react";
import { Card, Pill, Segmented } from "@/components/app/ui";

// Gráfico do TradingView (widget oficial e gratuito). Na B3 o dado vem com 15 min de atraso: só contexto.
const ATIVOS = {
  WIN: "BMFBOVESPA:WIN1!",
  WDO: "BMFBOVESPA:WDO1!",
  IBOV: "BMFBOVESPA:IBOV",
  Dólar: "FX_IDC:USDBRL",
} as const;
const TEMPOS = { "3 min": "3", "15 min": "15", "60 min": "60" } as const;
type Nome = keyof typeof ATIVOS;
type Tempo = keyof typeof TEMPOS;

export function Grafico() {
  const [nome, setNome] = useState<Nome>("WIN");
  const [tempo, setTempo] = useState<Tempo>("3 min");
  const [erro, setErro] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const simbolo = ATIVOS[nome];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%"></div>';
    setErro(false);
    const sc = document.createElement("script");
    sc.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    sc.async = true;
    sc.onerror = () => setErro(true);
    sc.innerHTML = JSON.stringify({
      symbol: simbolo,
      interval: TEMPOS[tempo],
      timezone: "America/Sao_Paulo",
      theme: "dark",
      locale: "br",
      autosize: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      backgroundColor: "#0B0F14",
    });
    el.appendChild(sc);
    const t = setTimeout(() => { if (!el.querySelector("iframe")) setErro(true); }, 10000);
    return () => clearTimeout(t);
  }, [simbolo, tempo]);

  return (
    <Card title="Gráfico">
      <Pill tone="warn">atrasado 15 min: só contexto, nunca pra entrar</Pill>
      <div className="mt-3 space-y-2">
        <Segmented<Nome> value={nome} options={["WIN", "WDO", "IBOV", "Dólar"]} onChange={setNome} />
        <Segmented<Tempo> value={tempo} options={["3 min", "15 min", "60 min"]} onChange={setTempo} />
        {erro && (
          <p className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
            Não consegui carregar esse gráfico. O TradingView grátis nem sempre libera os futuros da B3: tente IBOV ou Dólar.{" "}
            <a className="underline" href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(simbolo)}`} target="_blank" rel="noreferrer noopener">Abrir no TradingView</a>
          </p>
        )}
        <div ref={ref} className="tradingview-widget-container h-96 overflow-hidden rounded-lg" />
      </div>
    </Card>
  );
}
