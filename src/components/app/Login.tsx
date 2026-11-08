import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { signIn } from "@/lib/supabase";
import { inputCls } from "@/components/app/ui";

export function Login() {  
const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(""); const [carregando, setCarregando] = useState(false);
  const entrar = async () => {
    setErro(""); setCarregando(true);
        try { await signIn(email.trim(), senha); navigate({ to: "/", replace: true }); } catch (e) { setErro(e instanceof Error ? e.message : "Falha no login"); }
  };
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 px-4">
      <h1 className="text-xl font-bold">Agente Trader</h1>
      <p className="text-sm text-muted-foreground">Entre com o seu usuário.</p>
      <input type="email" autoComplete="email" placeholder="E-mail" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" autoComplete="current-password" placeholder="Senha" className={inputCls} value={senha} onChange={(e) => setSenha(e.target.value)} />
      <button onClick={entrar} disabled={carregando || !email || !senha} className="min-h-11 rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-40">{carregando ? "Entrando..." : "Entrar"}</button>
      {erro && <p className="text-sm text-warn">{erro}</p>}
    </div>
  );
}
