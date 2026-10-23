import { motion } from "framer-motion";
import splashImage from "@/assets/Branding/Connexy-Splash.png";
import { getSafeSplashConfig, isSplashActiveNow } from "@/lib/splash/splash-config";

export type SplashScreenProps = {
  /** Optional override image (prepared for future config). */
  image?: string;
  /** When true, marks as exiting (for animation). */
  exiting?: boolean;
};

export function SplashScreen({ image, exiting = false }: SplashScreenProps) {
  const cfg = getSafeSplashConfig();
  const active = isSplashActiveNow(cfg);

  // If disabled by config/schedule, render nothing (let app proceed).
  // But route still controls timing; this is a safe guard.
  if (!active && !exiting) {
    return null;
  }

  const imgSrc = image ?? cfg.image ?? splashImage;

  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-50 flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      aria-label="Tela inicial Connexy"
    >
      <img
        src={imgSrc}
        alt="Connexy"
        className="h-auto max-h-[90dvh] w-auto max-w-[88vw] select-none object-contain md:max-h-[min(780px,90dvh)] md:max-w-[min(420px,90vw)]"
        draggable={false}
      />
    </motion.div>
  );
}
