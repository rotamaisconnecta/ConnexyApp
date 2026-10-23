import { useEffect } from "react";
import { motion } from "framer-motion";
import splashImage from "@/assets/Branding/Connexy-Splash.png";
import { isSplashActiveNow } from "@/lib/splash/splash-config";
import { loadSplashConfig } from "@/lib/splash/splash-store";
import { canShowSplash, registerSplashImpression } from "@/lib/splash/splash-frequency";
import { useDemoIdentity } from "@/lib/demo/demo-identity";

export type SplashScreenProps = {
  /** Optional override image (prepared for future config). */
  image?: string;
  /** When true, marks as exiting (for animation). */
  exiting?: boolean;
};

export function SplashScreen({ image, exiting = false }: SplashScreenProps) {
  const cfg = loadSplashConfig();
  const active = isSplashActiveNow(cfg);
  const identity = useDemoIdentity();
  const allowed = canShowSplash(identity.id);

  const display = active && allowed;

  useEffect(() => {
    // Registra a impressão apenas quando a splash realmente foi exibida.
    // Registros duplicados no mesmo período são ignorados (não conta 2x).
    if (display) registerSplashImpression(identity.id);
  }, [display, identity.id]);

  // If disabled by config, outside the window or over the daily limit,
  // render nothing (let app proceed). Route still controls timing.
  if (!display && !exiting) {
    return null;
  }

  const imgSrc = image ?? cfg.image ?? splashImage;

  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-50 flex h-[100dvh] w-[100dvw] flex-col items-center justify-center overflow-hidden bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      aria-label="Tela inicial Connexy"
    >
      <img
        src={imgSrc}
        alt={cfg.title || "Connexy"}
        className="h-auto max-h-[90dvh] w-auto max-w-[88vw] select-none object-contain md:max-h-[min(780px,90dvh)] md:max-w-[min(420px,90vw)]"
        draggable={false}
      />
      {(cfg.title || cfg.subtitle) && (
        <div className="mt-4 flex w-full flex-col items-center px-8 text-center">
          {cfg.title ? (
            <h1 className="font-display text-xl font-bold leading-snug text-gray-900">
              {cfg.title}
            </h1>
          ) : null}
          {cfg.subtitle ? (
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{cfg.subtitle}</p>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}