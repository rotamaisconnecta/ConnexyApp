import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame, StatusBar } from "@/components/phone-frame";
import { motion } from "framer-motion";
import { Car, Users, Store } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Bem-vindo — RotaMais Connecta" },
      { name: "description", content: "Mova-se, conecte-se e descubra sua cidade em um só app." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col text-white relative overflow-hidden"
           style={{ background: "linear-gradient(180deg, #0f0a1f 0%, #1a0f3a 100%)" }}>
        <StatusBar dark />
        <div className="px-8 pt-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-white font-black text-2xl shadow-elegant">R+</div>
        </div>

        <div className="px-8 mt-8">
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-[40px] leading-[1.05] font-bold">
            Mova-se.<br /><span className="text-primary-glow">Conecte-se.</span><br />Descubra.
          </motion.h1>
          <p className="mt-4 text-white/70 text-[15px] leading-relaxed">
            Mobilidade, pessoas e negócios locais integrados em um só app.
          </p>
        </div>

        <div className="mt-10 px-8 grid grid-cols-3 gap-3">
          {[
            { Icon: Car, label: "Mobilidade" },
            { Icon: Users, label: "Social" },
            { Icon: Store, label: "Locais" },
          ].map(({ Icon, label }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              className="rounded-2xl bg-white/8 border border-white/10 p-4 flex flex-col items-center gap-2 backdrop-blur">
              <div className="h-10 w-10 grid place-items-center rounded-xl bg-white/10">
                <Icon className="h-5 w-5 text-primary-glow" />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto px-8 pb-10 flex flex-col gap-3">
          <Link to="/cadastro"
                className="w-full rounded-full bg-gradient-brand py-4 text-center text-white font-semibold shadow-elegant">
            Criar minha conta
          </Link>
          <Link to="/cadastro"
                className="w-full rounded-full border border-white/20 py-4 text-center text-white/90 font-medium">
            Já tenho conta · Entrar
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
