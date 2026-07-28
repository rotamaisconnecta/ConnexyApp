import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneFrame } from "@/components/phone-frame";
import { supabase } from "@/integrations/supabase/client";
import splashImage from "@/assets/Branding/Connexy-Splash.png";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const nav = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setShowSplash(false);
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;
      const { data } = await supabase.auth.getSession();
      if (!cancelled) nav({ to: data.session ? "/localizacao" : "/welcome" });
    }, 2000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [nav]);

  return (
    <PhoneFrame>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            className="flex-1 grid place-items-center bg-white relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img src={splashImage} alt="Connexy" className="h-full w-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </PhoneFrame>
  );
}
