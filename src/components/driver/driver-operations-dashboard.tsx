import { useState } from "react";
import {
  Bell,
  ChevronRight,
  CircleCheck,
  FileText,
  MapPinned,
  Navigation,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DriverOperationsDashboardProps {
  driverName: string;
  driverPhoto: string;
  isOnline: boolean;
  onToggleOnline: () => void;
  onOpenMap: () => void;
  onOpenDocuments: () => void;
}

const PERIODS = ["Hoje", "Semana", "Mês"] as const;
const AREAS = [
  { name: "Arena Central", detail: "Show · saída em 18 min", demand: "Muito alta", factor: "1,8×", color: "bg-violet-600" },
  { name: "Marina Norte", detail: "Restaurantes e bares", demand: "Alta", factor: "1,4×", color: "bg-fuchsia-500" },
  { name: "Centro Histórico", detail: "Movimento crescendo", demand: "Crescendo", factor: "1,3×", color: "bg-amber-400" },
];

const DOCUMENTS = [
  { name: "CNH", detail: "Vence em 14 mai 2027", approved: true },
  { name: "CRLV", detail: "Atualizado em 02 ago", approved: true },
  { name: "Comprovante de residência", detail: "Envie até 08 set", approved: false },
];

function moneyFor(period: (typeof PERIODS)[number]) {
  if (period === "Semana") return "R$ 1.486,00";
  if (period === "Mês") return "R$ 5.824,60";
  return "R$ 284,60";
}

export function DriverOperationsDashboard({
  driverName,
  driverPhoto,
  isOnline,
  onToggleOnline,
  onOpenMap,
  onOpenDocuments,
}: DriverOperationsDashboardProps) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Hoje");
  const [area, setArea] = useState(0);

  return (
    <div className="space-y-5 pb-2">
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <img src={driverPhoto} alt={driverName} className="h-11 w-11 rounded-2xl object-cover shadow-soft" />
          <div>
            <p className="text-[11px] text-muted-foreground">Área do motorista</p>
            <h1 className="font-display text-lg font-bold text-foreground">Olá, {driverName.split(" ")[0]}.</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Notificações" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-foreground shadow-soft">
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleOnline}
            className={cn("flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors", isOnline ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}
          >
            <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-white animate-pulse" : "bg-muted-foreground/50")} />
            {isOnline ? "Online" : "Offline"}
          </button>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-primary to-fuchsia-600 p-5 text-white shadow-floating">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white/75">Bom momento para dirigir</p>
            <h2 className="mt-1 text-xl font-bold">A demanda está 34% acima do normal.</h2>
            <p className="mt-2 max-w-[255px] text-xs leading-5 text-white/85">A Arena Central será o melhor ponto nos próximos 25 minutos.</p>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <button type="button" onClick={onOpenMap} className="mt-4 flex items-center gap-1 text-xs font-bold text-white">
          Ver no mapa <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Seus ganhos</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{moneyFor(period)}</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600">+18%</span>
        </div>
        <div className="mt-4 flex rounded-xl bg-muted p-1">
          {PERIODS.map((item) => (
            <button key={item} type="button" onClick={() => setPeriod(item)} className={cn("flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition-all", period === item ? "bg-surface text-primary shadow-soft" : "text-muted-foreground")}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-5 flex h-20 items-end gap-2" aria-label="Gráfico de ganhos">
          {[38, 58, 47, 78, 62, 96, 70].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col justify-end gap-1">
              <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: index * 0.05 }} className={cn("rounded-t-md", index === 5 ? "bg-primary" : "bg-primary/20")} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground"><span>9h</span><span>11h</span><span>13h</span><span>15h</span><span>17h</span><span>19h</span></div>
        <div className="mt-4 grid grid-cols-3 border-t border-border pt-3 text-center">
          <Metric value="12" label="corridas" />
          <Metric value="6h 20" label="online" />
          <Metric value="R$ 23,72" label="por corrida" />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between"><div><p className="text-sm font-bold">Meta semanal</p><p className="text-xs text-muted-foreground">Você está quase lá</p></div><span className="text-sm font-bold text-primary">78%</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[78%] rounded-full bg-gradient-brand" /></div>
        <div className="mt-3 flex items-end justify-between"><p className="text-xs text-muted-foreground">Faltam <span className="font-bold text-foreground">R$ 413,80</span> para sua meta.</p><span className="text-base font-bold">R$ 1.900</span></div>
        <button type="button" onClick={onOpenDocuments} className="mt-3 text-xs font-bold text-primary">Ver detalhes</button>
      </section>

      <section className="overflow-hidden rounded-3xl bg-[#13111D] p-5 text-white shadow-floating">
        <div className="flex items-start justify-between"><div><p className="text-xs text-white/60">Inteligência urbana</p><h2 className="mt-1 text-lg font-bold">Onde a cidade está acontecendo</h2><p className="mt-1 text-[11px] leading-4 text-white/65">Concentração estimada por eventos, lugares e movimento recente.</p></div><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-300">Ao vivo</span></div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {AREAS.map((item, index) => <button key={item.name} type="button" onClick={() => setArea(index)} className={cn("min-w-[112px] rounded-xl border px-3 py-2 text-left transition-colors", area === index ? "border-white/35 bg-white/15" : "border-white/10 bg-white/5")}><span className="block text-[10px] font-bold">{item.name}</span><span className="mt-1 block text-[9px] text-white/60">{item.factor} demanda</span></button>)}
        </div>
        <div className="relative mt-4 h-32 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950 via-slate-900 to-fuchsia-950">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 25% 60%, #a855f7 0 3px, transparent 4px), radial-gradient(circle at 70% 30%, #f59e0b 0 4px, transparent 5px), radial-gradient(circle at 78% 72%, #ec4899 0 3px, transparent 4px)", backgroundSize: "100% 100%" }} />
          <div className="absolute left-[23%] top-[53%] h-10 w-10 rounded-full bg-primary/30 blur-sm" /><div className="absolute left-[31%] top-[59%] h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
          <div className="absolute right-[25%] top-[27%] h-3 w-3 rounded-full bg-amber-400 ring-4 ring-amber-300/20" />
          <div className="absolute right-[18%] bottom-[20%] h-3 w-3 rounded-full bg-fuchsia-400 ring-4 ring-fuchsia-300/20" />
        </div>
        <div className="mt-4 rounded-2xl bg-white/10 p-3"><div className="flex items-center justify-between"><p className="text-xs font-bold">Melhor oportunidade agora</p><MapPinned className="h-4 w-4 text-violet-300" /></div><p className="mt-2 text-sm font-bold">{AREAS[area].name}</p><p className="text-[11px] text-white/60">{AREAS[area].detail}</p><div className="mt-3 grid grid-cols-3 text-center text-[10px]"><MiniInfo label="Demanda" value={AREAS[area].demand} /><MiniInfo label="Potencial" value={AREAS[area].factor} /><MiniInfo label="Até lá" value="8 min" /></div><button type="button" onClick={onOpenMap} className="mt-3 flex items-center gap-1 text-xs font-bold text-violet-200">Ir para esta região <Navigation className="h-3.5 w-3.5" /></button></div>
        <p className="mt-3 text-center text-[9px] text-white/40">Informações agregadas. Nenhum dado pessoal é exibido.</p>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-4 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Documentos</p><p className="text-xs text-muted-foreground">Tudo em dia, quase.</p></div><button type="button" onClick={onOpenDocuments} className="text-xs font-bold text-primary">Gerenciar</button></div><div className="mt-3 divide-y divide-border">{DOCUMENTS.map((doc) => <button type="button" onClick={onOpenDocuments} key={doc.name} className="flex w-full items-center gap-3 py-3 text-left"><div className={cn("grid h-9 w-9 place-items-center rounded-xl", doc.approved ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}><FileText className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold">{doc.name}</p><p className="text-[10px] text-muted-foreground">{doc.detail}</p></div>{doc.approved ? <CircleCheck className="h-4 w-4 text-emerald-500" /> : <span className="text-[10px] font-bold text-amber-600">Pendente</span>}</button>)}</div></section>

      <section className="rounded-3xl border border-border bg-surface p-4 shadow-soft"><div><p className="text-sm font-bold">Qualidade</p><p className="text-xs text-muted-foreground">Seu impacto nas viagens</p></div><div className="mt-4 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-full border-4 border-primary/20 text-center"><div><p className="text-lg font-bold">4,93</p><Star className="mx-auto h-3 w-3 fill-amber-400 text-amber-400" /></div></div><div className="flex-1 space-y-2"><QualityRow label="Direção segura" value="Excelente" /><QualityRow label="Conforto" value="Ótimo" /><QualityRow label="Comunicação" value="Ótimo" /></div></div><p className="mt-4 rounded-xl bg-muted px-3 py-2.5 text-[11px] italic text-muted-foreground">“Carro impecável e viagem tranquila.” — passageiro recente</p></section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div><p className="text-xs font-bold">{value}</p><p className="text-[9px] text-muted-foreground">{label}</p></div>; }
function MiniInfo({ label, value }: { label: string; value: string }) { return <div><p className="text-white/50">{label}</p><p className="mt-0.5 font-bold">{value}</p></div>; }
function QualityRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between text-[11px]"><span className="text-muted-foreground">{label}</span><span className="font-bold text-foreground">{value}</span></div>; }
