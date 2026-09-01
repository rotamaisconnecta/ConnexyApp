import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneFrame } from "@/components/phone-frame";
import { supabase } from "@/lib/supabase/client";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/demo/demo-config";
import { isDemoAuthenticated } from "@/lib/demo/demo-auth";
import splashImage from "@/assets/Branding/Connexy-Splash.png";

const SPLASH_MIN_MS = 2000;
const SESSION_TIMEOUT_MS = 5000;
const FADE_MS = 600;

export const Route = createFileRoute("/")({
  component: Splash,
});

type Destination = "/auth" | "/home";

function Splash() {
  const nav = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let transitionTimer: ReturnType<typeof setTimeout> | undefined;
    let sessionTimeout: ReturnType<typeof setTimeout> | undefined;

    const startTransition = (destination: Destination) => {
      if (cancelled) return;
      setShowSplash(false);
      transitionTimer = setTimeout(() => {
        if (cancelled) return;
        try {
          nav({ to: destination, replace: true });
        } catch {
          setShowSplash(true);
        }
      }, FADE_MS);
    };

    const resolveDestination = (): Promise<Destination> => {
      if (isDemoMode()) {
        return Promise.resolve(isDemoAuthenticated() ? "/home" : "/auth");
      }

      if (!isPublicSupabaseConfigured()) return Promise.resolve("/auth");

      const getDestination = async (): Promise<Destination> => {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (import.meta.env.DEV) console.warn("[auth] getSession failed; redirecting to /auth");
          return "/auth";
        }
        return data.session ? "/home" : "/auth";
      };

      return Promise.race([
        getDestination().catch(() => {
          if (import.meta.env.DEV) console.warn("[auth] getSession error; redirecting to /auth");
          return "/auth" as Destination;
        }),
        new Promise<Destination>((resolve) => {
          sessionTimeout = setTimeout(() => resolve("/auth"), SESSION_TIMEOUT_MS);
        }),
      ]);
    };

    const splashTimer = setTimeout(() => {
      resolveDestination().then(startTransition);
    }, SPLASH_MIN_MS);

    return () => {
      cancelled = true;
      clearTimeout(splashTimer);
      clearTimeout(transitionTimer);
      clearTimeout(sessionTimeout);
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
