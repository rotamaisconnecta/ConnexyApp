import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneFrame, StatusBar } from "@/components/phone-frame";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Check } from "lucide-react";

export const Route = createFileRoute("/localizacao")({
  head: () => ({ meta: [{ title: "Permitir localização — RotaMais Connecta" }] }),
  component: LocationPermission,
});

function LocationPermission() {
  const nav = useNavigate();
  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col text-white"
           style={{ background: "linear-gradient(180deg, #0f0a1f 0%, #1a0f3a 100%)" }}>
        <StatusBar dark />
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <Link to="/interesses" className="h-9 w-9 grid place-items-center rounded-full bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-xs text-white/60">Passo 3 de 3</span>
          <span className="w-9" />
        </div>

        <div className="px-6 flex-1 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mt-6 relative">
            <div className="h-40 w-40 rounded-full bg-primary/20 grid place-items-center relative">
              <div className="absolute inset-4 rounded-full bg-primary/25 animate-pulse" />
              <div className="absolute inset-10 rounded-full bg-primary/40" />
              <div className="relative h-16 w-16 rounded-full bg-gradient-brand grid place-items-center shadow-elegant">
                <MapPin className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>

          <h1 className="mt-8 font-display text-2xl font-bold">
            Para uma experiência<br />completa, precisamos da<br />sua localização.
          </h1>

          <ul className="mt-6 space-y-3 text-left w-full max-w-xs mx-auto">
            {[
              "Ver pessoas próximas",
              "Encontrar melhores rotas",
              "Mostrar lugares e promoções perto de você",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-white/85">
                <span className="mt-0.5 h-5 w-5 grid place-items-center rounded-full bg-primary/30 shrink-0">
                  <Check className="h-3 w-3 text-primary-glow" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 pb-8 space-y-3">
          <button
            onClick={() => nav({ to: "/home" })}
            className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant">
            Permitir localização
          </button>
          <button onClick={() => nav({ to: "/home" })} className="w-full text-center text-sm text-white/60">
            Agora não
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
