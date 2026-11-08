import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, Field, PageTitle, Pill, Segmented, inputCls } from "@/components/app/ui";
import { janelaFora, uid, useStore, type Impacto } from "@/lib/store";
import { chamarFuncao } from "@/lib/supabase";

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

type NoticiaReal = { id: string; titulo: string; resumo: string; costuma: string; fonte: string; link: string; publicado_em: string | null };
type RespostaNoticias = { noticias: NoticiaReal[]; explicado_por_ia: boolean; portais_ok: string[]; aviso: string };

const quando = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

function Noticias() {
  const { eventos, setEventos } = useStore();
  const [f, setF] = useState({ hora: "", nome: "", pais: "EUA", impacto: "Alto" as Impacto });
  const [lista, setLista] = useState<NoticiaReal[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async (forcar: boolean) => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await chamarFuncao<RespostaNoticias>("noticias", { forcar });
      setLista(r.noticias);
      setAviso(r.aviso);
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  };
  useEffect(() => { void carregar(false); }, []);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.hora || !f.nome) return;
    setEventos([...eventos, { id: uid(), ...f }].sort((a, b) => a.hora.localeCompare(b.hora)));
    setF({ ...f, hora: "", nome: "" });
  };

  return (
    <div className="space-y-4">
      <PageTitle>Notícias</PageTitle>
      <button onClick={() => void carregar(true)} disabled={carregando} className="w-full rounded-lg border border-border font-medium disabled:opacity-40">{carregando ? "Buscando notícias..." : "Atualizar notícias"}</button>
      {erro && <p className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">{erro}</p>}
      {!carregando && !erro && lista.length === 0 && <Card><p className="text-sm text-muted-foreground">Nenhuma notícia relevante agora.</p></Card>}
      {lista.map((n) => (
        <Card key={n.id}>
          <p className="text-xs text-muted-foreground">{n.fonte}{n.publicado_em ? ` · ${quando(n.publicado_em)}` : ""}</p>
          <h3 className="font-semibold">{n.titulo}</h3>
          {n.resumo && <p className="mt-1 text-sm text-muted-foreground">{n.resumo}</p>}
          {n.costuma && <p className="mt-2 text-sm"><b>Costuma:</b> {n.costuma}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {/^https?:\/\//i.test(n.link) && <a href={n.link} target="_blank" rel="noreferrer noopener" className="flex min-h-11 items-center justify-center rounded-lg border border-border text-sm">Ver fonte</a>}
            <Link to="/agente" search={{ q: n.titulo }} className="flex min-h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">Perguntar ao agente</Link>
          </div>
        </Card>
      ))}
      {aviso && !erro && <p className="text-xs text-muted-foreground">{aviso}</p>}
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
