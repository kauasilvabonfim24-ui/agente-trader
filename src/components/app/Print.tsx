import { useEffect, useState } from "react";
import { urlAssinada } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function Print({ path, className, onClick }: { path: string; className?: string; onClick?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    urlAssinada(path).then((u) => vivo && setUrl(u)).catch(() => vivo && setUrl(""));
    return () => { vivo = false; };
  }, [path]);
  if (!url) return <div className={cn("flex items-center justify-center bg-muted text-xs text-muted-foreground", className)}>{url === "" ? "Sem imagem" : "..."}</div>;
  return <img src={url} alt="Print do trade" onClick={onClick} className={cn("object-cover", onClick && "cursor-zoom-in", className)} />;
}
