import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CarFront,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  History,
  MapPin,
  Navigation,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DriverEarnings } from "@/lib/driver/driver-types";

type Period = "Hoje" | "Semana" | "Mês";

interface DriverCommandCenterProps {
  driverName: string;
  rating: number;
  earnings: DriverEarnings;
  isOnline: boolean;
  onToggleOnline: () => void;
}

const chartData: Record<Period, { label: string; value: number }[]> = {
  Hoje: [
    { label: "7h", value: 18 },
    { label: "9h", value: 38 },
    { label: "11h", value: 31 },
    { label: "13h", value: 62 },
    { label: "15h", value: 48 },
    { label: "17h", value: 79 },
    { label: "19h", value: 92 },
  ],
  Semana: [
    { label: "Seg", value: 168 },
    { label: "Ter", value: 215 },
    { label: "Qua", value: 194 },
    { label: "Qui", value: 244 },
    { label: "Sex", value: 301 },
    { label: "Sáb", value: 227 },
    { label: "Dom", value: 137 },
  ],
  Mês: [
    { label: "Sem 1", value: 760 },
    { label: "Sem 2", value: 830 },
    { label: "Sem 3", value: 915 },
    { label: "Sem 4", value: 952 },
  ],
};

const zones = [
  {
    id: "arena",
    name: "Arena Central",
    detail: "Show · saída em 18 min",
    demand: "Muito alta",
    multiplier: "1,8×",
    eta: "8 min",
    left: "65%",
    top: "25%",
  },
  {
    id: "marina",
    name: "Marina Norte",
    detail: "Restaurantes · movimento agora",
    demand: "Alta",
    multiplier: "1,4×",
    eta: "11 min",
    left: "27%",
    top: "63%",
  },
  {
    id: "centro",
    name: "Centro Histórico",
    detail: "Bares · pico às 22h",
    demand: "Crescendo",
    multiplier: "1,3×",
    eta: "6 min",
    left: "72%",
    top: "72%",
  },
] as const;

const panelMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

function currency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function DriverCommandCenter({
  driverName,
  rating,
  earnings,
  isOnline,
  onToggleOnline,
}: DriverCommandCenterProps) {
  const [period, setPeriod] = useState<Period>("Hoje");
  const [selectedZoneId, setSelectedZoneId] = useState<(typeof zones)[number]["id"]>("arena");
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [documentSent, setDocumentSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0];
  const chart = useMemo(() => chartData[period], [period]);
  const periodSummary = {
    Hoje: { value: earnings.today, rides: 12, online: "6h20", trend: "+18%" },
    Semana: { value: earnings.week, rides: 67, online: "34h", trend: "+12%" },
    Mês: { value: earnings.month, rides: earnings.totalTrips, online: "132h", trend: "+9%" },
  }[period];

  function handleDocument(file?: File) {
    if (!file) return;
    setDocumentSent(true);
    toast.success("Documento enviado para análise", { description: file.name });
  }

  return (
    <div className="relative overflow-hidden pb-3">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_76%_4%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_55%)]" />

      <header className="relative flex items-center gap-3 px-5 pb-4 pt-1">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem_1rem_1rem_.4rem] bg-gradient-brand text-sm font-bold text-white shadow-soft">
          {driverName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">Área do motorista</p>
          <h1 className="truncate font-display text-xl font-bold">
            Olá, {driverName.split(" ")[0]}.
          </h1>
        </div>
        <button
          type="button"
          onClick={onToggleOnline}
          aria-pressed={isOnline}
          className="flex h-9 items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 text-xs font-semibold shadow-soft backdrop-blur-xl"
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isOnline
                ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]"
                : "bg-muted-foreground",
            )}
          />
          {isOnline ? "Online" : "Offline"}
        </button>
        <Link
          to="/notifications"
          aria-label="Notificações"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/80 bg-white/70 shadow-soft backdrop-blur-xl"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-white" />
        </Link>
      </header>

      <main className="relative space-y-4 px-4">
        <motion.section
          {...panelMotion}
          className="grid grid-cols-[auto_1fr] gap-3 rounded-[1.45rem] bg-gradient-brand p-4 text-white shadow-elegant"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold">Bom momento para dirigir</p>
            <p className="mt-1 text-xs leading-relaxed text-white/80">
              A demanda está 34% acima do normal. A Arena Central será o melhor ponto nos próximos
              25 minutos.
            </p>
            <button
              type="button"
              onClick={() =>
                document.getElementById("driver-demand-map")?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold"
            >
              Ver no mapa <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.section>

        <motion.section
          {...panelMotion}
          transition={{ ...panelMotion.transition, delay: 0.05 }}
          className="rounded-[1.65rem] border border-white/90 bg-white/75 p-5 shadow-soft backdrop-blur-2xl"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Seus ganhos</p>
                <p className="mt-1 font-display text-[1.7rem] font-bold tracking-tight">
                  {currency(periodSummary.value)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <TrendingUp className="h-3 w-3" /> {periodSummary.trend}
                  </span>
                  frente ao período anterior
                </p>
              </div>
              <Link
                to="/driver/finance"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"
                aria-label="Abrir financeiro"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-3 rounded-xl bg-secondary/80 p-1">
              {(["Hoje", "Semana", "Mês"] as Period[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPeriod(item)}
                  className={cn(
                    "rounded-lg py-2 text-[11px] font-semibold transition",
                    period === item ? "bg-surface text-primary shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 h-44 w-full" aria-label={`Gráfico de ganhos: ${period}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 12, right: 2, left: 2, bottom: 0 }}>
                <defs>
                  <linearGradient id="driverEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  dy={8}
                />
                <Tooltip
                  cursor={{ stroke: "var(--primary)", strokeOpacity: 0.25 }}
                  contentStyle={{
                    border: 0,
                    borderRadius: 14,
                    boxShadow: "var(--shadow-soft)",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [currency(value), "Ganhos"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#driverEarnings)"
                  activeDot={{ r: 4, fill: "white", stroke: "var(--primary)", strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pt-2">
            <MetricPill icon={ReceiptText} value={String(periodSummary.rides)} label="corridas" />
            <MetricPill icon={Clock3} value={periodSummary.online} label="online" />
            <MetricPill
              icon={CircleDollarSign}
              value={currency(earnings.averagePerTrip)}
              label="por corrida"
            />
          </div>
        </motion.section>

        <nav
          className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4"
          aria-label="Atalhos do motorista"
        >
          <QuickLink to="/driver/finance" icon={WalletCards} label="Ganhos" />
          <QuickLink to="/driver/performance" icon={TrendingUp} label="Desempenho" />
          <QuickLink to="/driver/history" icon={History} label="Histórico" />
          <button
            type="button"
            onClick={() => setDocumentsOpen(true)}
            className="flex min-w-[104px] snap-start items-center gap-2 rounded-2xl border border-white/90 bg-white/70 px-3 py-3 text-xs font-semibold shadow-soft backdrop-blur-xl"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            Documentos
          </button>
        </nav>

        <motion.section
          id="driver-demand-map"
          {...panelMotion}
          className="scroll-mt-3 rounded-[1.65rem] border border-white/90 bg-white/75 p-5 shadow-soft backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary">Inteligência urbana</p>
              <h2 className="mt-1 font-display text-xl font-bold">
                Onde a cidade está acontecendo
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Eventos e lugares com maior potencial de corridas.
              </p>
            </div>
            <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700">
              <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ao vivo
            </span>
          </div>

          <div className="relative mt-4 h-72 overflow-hidden rounded-[1.35rem] bg-[#ebe9ef]">
            <div className="absolute -left-8 top-[47%] h-4 w-[120%] -rotate-6 bg-white/80" />
            <div className="absolute left-[49%] -top-8 h-[120%] w-4 rotate-12 bg-white/80" />
            <div className="absolute -left-6 top-[76%] h-2.5 w-[115%] rotate-12 bg-white/70" />
            <div className="absolute left-[78%] -top-8 h-[120%] w-2.5 -rotate-[18deg] bg-white/70" />
            <span className="absolute left-[43%] top-[56%] text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Centro
            </span>
            <span className="absolute left-[8%] top-[24%] text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Marina
            </span>

            {zones.map((zone, index) => {
              const selected = zone.id === selectedZone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  aria-label={`${zone.name}, demanda ${zone.demand}`}
                  className={cn(
                    "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-all",
                    index === 0
                      ? "h-20 w-20 bg-rose-400/20 ring-[14px] ring-rose-400/10"
                      : "h-16 w-16 bg-primary/15 ring-[12px] ring-primary/5",
                    selected && "scale-110",
                  )}
                  style={{ left: zone.left, top: zone.top }}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-full bg-white text-xs font-bold shadow-lg",
                      index === 0 ? "text-rose-600" : "text-primary",
                      selected && "ring-2 ring-primary/35 ring-offset-2",
                    )}
                  >
                    {zone.multiplier}
                  </span>
                </button>
              );
            })}

            <span className="absolute left-[42%] top-[70%] inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1.5 text-[10px] font-bold text-white shadow-lg">
              <Navigation className="h-3 w-3 fill-white" /> Você
            </span>
            <div className="absolute bottom-3 left-3 flex gap-2 rounded-xl bg-white/80 px-2.5 py-2 text-[9px] text-muted-foreground backdrop-blur-xl">
              <span className="flex items-center gap-1">
                <i className="h-1.5 w-1.5 rounded-full bg-primary/50" /> Alta
              </span>
              <span className="flex items-center gap-1">
                <i className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Muito alta
              </span>
            </div>
          </div>

          <div className="pt-4">
            <p className="flex items-center gap-1 text-[11px] font-bold text-primary">
              <MapPin className="h-3.5 w-3.5" /> Melhor oportunidade agora
            </p>
            <h3 className="mt-2 font-display text-xl font-bold">{selectedZone.name}</h3>
            <p className="text-xs text-muted-foreground">{selectedZone.detail}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <ZoneMetric label="Demanda" value={selectedZone.demand} />
              <ZoneMetric label="Potencial" value={selectedZone.multiplier} />
              <ZoneMetric label="Até lá" value={selectedZone.eta} />
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border/70 p-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold">Próximo pico às 21h40</p>
                <p className="text-[10px] text-muted-foreground">
                  Previsão baseada no encerramento do evento
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.success(`Rota para ${selectedZone.name} iniciada`)}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-sm font-bold text-white shadow-elegant active:scale-[.98]"
            >
              <Navigation className="h-4 w-4" /> Ir para esta região
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Dados agregados. Nenhuma pessoa é identificada.
            </p>
          </div>
        </motion.section>

        <motion.section
          {...panelMotion}
          className="rounded-[1.65rem] border border-white/90 bg-white/75 p-5 shadow-soft backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Meta semanal</p>
              <h2 className="font-display text-lg font-bold">Você está quase lá</h2>
            </div>
            <strong className="font-display text-2xl text-primary">78%</strong>
          </div>
          <Progress value={78} className="mt-4 h-1.5" />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Faltam <strong className="text-foreground">R$ 413,80</strong> para sua meta de R$ 1.900.
          </p>
        </motion.section>

        <motion.section
          {...panelMotion}
          className="rounded-[1.65rem] border border-white/90 bg-white/75 p-5 shadow-soft backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Documentos</p>
              <h2 className="font-display text-lg font-bold">Tudo em dia, quase.</h2>
            </div>
            <button
              type="button"
              onClick={() => setDocumentsOpen(true)}
              className="text-xs font-bold text-primary"
            >
              Gerenciar
            </button>
          </div>
          <div className="mt-3 divide-y divide-border/70">
            <DocumentRow icon={FileCheck2} title="CNH" detail="Vence em 14 mai 2027" approved />
            <DocumentRow icon={CarFront} title="CRLV" detail="Atualizado em 02 ago" approved />
            <DocumentRow
              icon={FileText}
              title="Comprovante de residência"
              detail={documentSent ? "Enviado agora" : "Envie até 08 set"}
              approved={documentSent}
              onClick={() => setDocumentsOpen(true)}
            />
          </div>
        </motion.section>

        <motion.section
          {...panelMotion}
          className="rounded-[1.65rem] border border-white/90 bg-white/75 p-5 shadow-soft backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Qualidade</p>
              <h2 className="font-display text-lg font-bold">Seu impacto nas viagens</h2>
            </div>
            <span className="flex items-center gap-1 font-display text-xl font-bold text-primary">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {rating.toFixed(2)}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <QualityRow label="Direção segura" value={96} status="Excelente" />
            <QualityRow label="Conforto" value={91} status="Ótimo" />
            <QualityRow label="Comunicação" value={88} status="Ótimo" />
          </div>
        </motion.section>
      </main>

      <Sheet open={documentsOpen} onOpenChange={setDocumentsOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[88dvh] max-w-[420px] overflow-y-auto rounded-t-[2rem] border-white/70 bg-background/95 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] backdrop-blur-2xl"
        >
          <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-border" />
          <SheetHeader className="text-left">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <SheetTitle className="font-display text-2xl">Enviar documento</SheetTitle>
            <SheetDescription>
              Selecione uma imagem ou PDF legível. A análise costuma levar menos de 24 horas.
            </SheetDescription>
          </SheetHeader>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(event) => handleDocument(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-primary/35 bg-primary/[.04] p-5"
          >
            {documentSent ? (
              <>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-4 w-4" />
                </span>
                <strong className="text-sm">Documento recebido</strong>
                <span className="text-xs text-muted-foreground">Aguardando análise</span>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-primary" />
                <strong className="text-sm">Comprovante de residência</strong>
                <span className="text-xs text-muted-foreground">JPG, PNG ou PDF · até 10 MB</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 h-12 w-full rounded-2xl bg-gradient-brand text-sm font-bold text-white shadow-elegant"
          >
            {documentSent ? "Enviar outro arquivo" : "Escolher arquivo"}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Seus dados são usados apenas para validação.
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MetricPill({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof ReceiptText;
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-w-[122px] snap-start items-center gap-2 rounded-2xl bg-secondary/65 p-3">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span>
        <strong className="block text-xs">{value}</strong>
        <small className="text-[10px] text-muted-foreground">{label}</small>
      </span>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/driver/finance" | "/driver/performance" | "/driver/history";
  icon: typeof WalletCards;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-w-[104px] snap-start items-center gap-2 rounded-2xl border border-white/90 bg-white/70 px-3 py-3 text-xs font-semibold shadow-soft backdrop-blur-xl"
    >
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </Link>
  );
}

function ZoneMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/70 p-3">
      <small className="block text-[9px] text-muted-foreground">{label}</small>
      <strong className="mt-1 block truncate text-[11px]">{value}</strong>
    </div>
  );
}

function DocumentRow({
  icon: Icon,
  title,
  detail,
  approved,
  onClick,
}: {
  icon: typeof FileText;
  title: string;
  detail: string;
  approved: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3 text-left"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-xs">{title}</strong>
        <small className="text-[10px] text-muted-foreground">{detail}</small>
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-1 text-[9px] font-bold",
          approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
        )}
      >
        {approved ? "Aprovado" : "Pendente"}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function QualityRow({ label, value, status }: { label: string; value: number; status: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr_54px] items-center gap-2 text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <i className="block h-full rounded-full bg-gradient-brand" style={{ width: `${value}%` }} />
      </div>
      <strong className="text-right">{status}</strong>
    </div>
  );
}
