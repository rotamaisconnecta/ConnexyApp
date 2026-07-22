import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame, StatusBar } from "@/components/phone-frame";
import { Camera, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — RotaMais Connecta" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("Lucas Almeida");
  const [contact, setContact] = useState("(11) 96765-4321");
  const [pass, setPass] = useState("••••••••");
  return (
    <PhoneFrame>
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-2 pb-4">
        <Link to="/welcome" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs text-muted-foreground">Passo 1 de 3</span>
        <span className="w-9" />
      </div>

      <div className="px-6 flex-1 flex flex-col">
        <h1 className="font-display text-2xl font-bold">Criar sua conta</h1>
        <p className="text-sm text-muted-foreground mt-1">É rápido e fácil.</p>

        <div className="mt-6 flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gradient-brand grid place-items-center text-white text-3xl font-bold shadow-elegant">
              LA
            </div>
            <button className="absolute -bottom-1 -right-1 h-8 w-8 grid place-items-center rounded-full bg-primary text-white shadow-elegant border-2 border-surface">
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Field label="Nome completo" value={name} onChange={setName} />
          <Field label="E-mail ou telefone" value={contact} onChange={setContact} />
          <Field label="Senha" value={pass} onChange={setPass} type="password" />
        </div>

        <div className="mt-auto pt-6 pb-6 space-y-3">
          <button
            onClick={() => nav({ to: "/completar-perfil" })}
            className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant"
          >
            Continuar
          </button>
          <button className="w-full text-center text-sm text-muted-foreground">Pular</button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
