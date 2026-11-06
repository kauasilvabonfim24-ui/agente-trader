import { Link } from "@tanstack/react-router";
import { Sun, ScanSearch, Newspaper, NotebookPen, Bot, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Login } from "@/components/app/Login";
import { signOut, supabaseConfigurado, useSession } from "@/lib/supabase";

const tabs = [
  { to: "/", label: "Hoje", icon: Sun },
  { to: "/analisar", label: "Analisar", icon: ScanSearch },
  { to: "/noticias", label: "Notícias", icon: Newspaper },
  { to: "/diario", label: "Diário", icon: NotebookPen },
  { to: "/agente", label: "Agente", icon: Bot },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const session = useSession();
  if (supabaseConfigurado && !session) return <Login />;
  return (
    <div className="mx-auto min-h-screen max-w-xl">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-sm font-semibold text-ok">Agente Trader</span>
        {session && <button onClick={signOut} className="ml-auto mr-1 min-h-11 px-2 text-sm text-muted-foreground">Sair</button>}
        <Link to="/config" aria-label="Configurações" className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
          <Settings className="h-5 w-5" />
        </Link>
      </div>
      <main className="px-4 pb-40 pt-2">{children}</main>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur">
        <nav className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
              activeProps={{ className: "text-ok font-semibold" }}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <p className="pb-[max(env(safe-area-inset-bottom),6px)] text-center text-[11px] text-muted-foreground">
          Conteúdo educativo, não é recomendação
        </p>
      </div>
    </div>
  );
}
