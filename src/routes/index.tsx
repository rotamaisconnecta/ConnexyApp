import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { PhoneFrame } from "@/components/phone-frame";
import { Logo } from "@/components/logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const nav = useNavigate();
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) nav({ to: data.session ? "/localizacao" : "/welcome" });
    }, 1800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [nav]);

  return (
    <PhoneFrame>
      <div className="flex-1 grid place-items-center bg-[#0f0a1f] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px 400px at 50% 30%, rgba(108,59,255,0.6), transparent)",
          }}
        />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="relative flex flex-col items-center gap-4"
        >
          <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-brand text-white font-black text-4xl shadow-elegant">
            R+
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-bold">RotaMais</div>
            <div className="text-primary-glow text-lg font-semibold -mt-1">Connecta</div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-16 flex items-center gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/70"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.div>
        <Logo size={0} variant="light" />
      </div>
    </PhoneFrame>
  );
}
