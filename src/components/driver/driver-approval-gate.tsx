/* Gate de aprovação do Modo Motorista (Fase 6.3).
   Substitui o painel do motorista quando o usuário ainda não
   está aprovado para operar. Não altera o núcleo de dispatch. */

import { useNavigate } from "@tanstack/react-router";
import { Car, Clock3, FileCheck2, ShieldCheck } from "lucide-react";
import { Colors } from "@/theme";
import type { DriverApplicationStatus } from "@/lib/driver/driver-application-storage";

const COPY: Record<
  DriverApplicationStatus,
  { title: string; description: string; action: string; icon: typeof Car }
> = {
  draft: {
    title: "Torne-se Motorista",
    description:
      "Cadastre-se para receber solicitações de corrida e começar a operar pela Connexy.",
    action: "Começar cadastro",
    icon: Car,
  },
  pending: {
    title: "Cadastro em análise",
    description: "Aprovação feita pela equipe técnica da Connexy após revisão do seu cadastro.",
    action: "Consultar cadastro",
    icon: Clock3,
  },
  approved: {
    title: "Motorista Liberado",
    description: "Seu cadastro foi aprovado. Você já pode receber solicitações de corrida.",
    action: "Abrir painel",
    icon: ShieldCheck,
  },
  rejected: {
    title: "Reveja seu cadastro",
    description: "Revise as informações do seu cadastro para continuar operando pela Connexy.",
    action: "Revisar cadastro",
    icon: FileCheck2,
  },
};

export function DriverApprovalGate({ status }: { status: DriverApplicationStatus }) {
  const navigate = useNavigate();
  const copy = COPY[status];
  const Icon = copy.icon;

  return (
    <div className="px-4 pt-4">
      <div
        className="rounded-[24px] border border-border bg-surface p-6 shadow-soft"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div className="flex flex-col items-center text-center">
          <span
            className="grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: Colors.brand.primary + "1A", color: Colors.brand.primary }}
          >
            <Icon className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">{copy.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
          <button
            type="button"
            onClick={() => navigate({ to: "/driver/cadastro" })}
            className="mt-6 w-full rounded-full px-6 py-3 text-sm font-bold text-white"
            style={{ background: Colors.brand.primary }}
          >
            {copy.action}
          </button>
        </div>
      </div>
    </div>
  );
}
