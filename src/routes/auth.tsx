import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { StatusBar, PhoneFrame } from "@/components/phone-frame";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Connecta" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/localizacao" });
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        nav({ to: "/localizacao" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    toast.success("Bem-vindo!");
    nav({ to: "/localizacao" });
  }

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col bg-gradient-to-b from-accent/50 to-surface">
        <StatusBar />
        <div className="flex-1 flex flex-col justify-center px-6 pb-10">
          <div className="text-center mb-6">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-brand grid place-items-center text-white shadow-elegant text-2xl font-bold">C</div>
            <h1 className="mt-3 font-display text-2xl font-bold">
              {mode === "signin" ? "Entrar no Connecta" : "Criar sua conta"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Bem-vindo de volta ao seu bairro." : "Conecte-se com quem está por perto."}
            </p>
          </div>

          <button
            onClick={google}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-surface border border-border font-semibold flex items-center justify-center gap-3 shadow-soft hover:bg-secondary transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.3l6.7-6.7C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.4z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2.1 1.4-4.8 2.2-7.6 2.2-6.3 0-11.6-3.5-13.5-8.4l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-2 my-5 text-xs text-muted-foreground">
            <div className="h-px bg-border flex-1" /> ou <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full h-12 rounded-2xl bg-surface border border-border px-4 text-sm outline-none focus:border-primary"
              />
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full h-12 rounded-2xl bg-surface border border-border pl-11 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha (mín. 6 caracteres)" minLength={6}
                className="w-full h-12 rounded-2xl bg-surface border border-border pl-11 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full h-12 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {mode === "signin" ? "Novo aqui? " : "Já tem conta? "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-semibold">
              {mode === "signin" ? "Criar conta" : "Entrar"}
            </button>
          </p>
          <Link to="/home" className="text-center text-xs text-muted-foreground mt-3 block">
            Continuar sem entrar
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
