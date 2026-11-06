import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, Field, PageTitle, Pill, Segmented, inputCls } from "@/components/app/ui";
import { janelaFora, uid, useStore, type Impacto } from "@/lib/store";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Notícias · Agente Trader" },
      { name: "description", content: "Notícias explicadas e eventos do dia." },
      { property: "og:title", content: "Notícias · Agente Trader" },
      { property: "og:description", content: "Notícias explicadas e eventos do dia." },
    ],
  }),
  component: Noticias,
});

function Noticias() {
  const { noticias, eventos, setEventos } = useStore();
  const [f, setF] = useState({ hora: "", nome: "", pais: "EUA", impacto: "Alto" as Impacto });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.hora || !f.nome) return;
    setEventos([...eventos, { id: uid(), ...f }].sort((a, b) => a.hora.localeCompare(b.hora)));
    setF({ ...f, hora: "", nome: "" });
  };

  return (
    <div className="space-y-4">
      <PageTitle>Notícias</PageTitle>
      {noticias.map((n) => (
        <Card key={n.id}>
          <p className="text-xs text-muted-foreground">{n.hora}</p>
          <h3 className="font-semibold">{n.titulo}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{n.resumo}</p>
          <p className="mt-2 text-sm"><b>Costuma:</b> {n.costuma}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={n.fonte} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center rounded-lg border border-border text-sm">Ver fonte</a>
            <Link to="/agente" search={{ q: n.titulo }} className="flex min-h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">Perguntar ao agente</Link>
          </div>
        </Card>
      ))}

      <Card title="Eventos do dia">
        <ul className="mb-4 divide-y divide-border">
          {eventos.map((e) => (
            <li key={e.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="font-mono font-semibold">{e.hora}</span>
              <span className="flex-1">{e.nome} · {e.pais}</span>
              <Pill tone={e.impacto === "Alto" ? "warn" : "muted"}>{e.impacto}</Pill>
              {e.impacto === "Alto" && <span className="hidden text-xs text-muted-foreground sm:inline">{janelaFora(e.hora)}</span>}
              <button aria-label={`Remover ${e.nome}`} onClick={() => setEventos(eventos.filter((x) => x.id !== e.id))} className="flex w-11 items-center justify-center text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Hora"><input type="time" className={inputCls} value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} /></Field>
            <div className="col-span-2"><Field label="Nome"><input className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: CPI" /></Field></div>
          </div>
          <Field label="País"><input className={inputCls} value={f.pais} onChange={(e) => setF({ ...f, pais: e.target.value })} /></Field>
          <Field label="Impacto"><Segmented<Impacto> value={f.impacto} options={["Alto", "Médio", "Baixo"]} onChange={(v) => setF({ ...f, impacto: v })} /></Field>
          <button className="w-full rounded-lg bg-primary font-semibold text-primary-foreground">Adicionar evento</button>
        </form>
      </Card>
    </div>
  );
}
