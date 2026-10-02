import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { CalendarDays, FileText, Images, MapPin, X, type LucideIcon } from "lucide-react";
import { ATTACHMENT_OPTIONS, MessageKind, type AttachmentAction } from "@/lib/chat/chat-types";
import { Animations, Colors, IconConfig, Shadows } from "@/theme";

interface AttachmentSheetProps {
  open: boolean;
  onSelect: (kind: AttachmentAction) => void;
  onClose: () => void;
}

const OPTION_ICONS: Record<string, LucideIcon> = {
  [MessageKind.IMAGE]: Images,
  [MessageKind.FILE]: FileText,
  [MessageKind.LOCATION]: MapPin,
  "share-content": CalendarDays,
};

const overlayTransition = { duration: 0.2, ease: "easeOut" as const };

const itemStagger = {
  hidden: { opacity: 0, y: 8 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 + index * 0.03, duration: 0.22, ease: "easeOut" as const },
  }),
};

function shouldDismissDrag(info: PanInfo): boolean {
  return info.offset.y > 72 || info.velocity.y > 720;
}

export function AttachmentSheet({ open, onSelect, onClose }: AttachmentSheetProps) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const dragControls = useDragControls();

  useLayoutEffect(() => {
    const node = sentinelRef.current?.closest("main");
    if (node instanceof HTMLElement) setHost(node);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const sheet = (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="attach-overlay"
            type="button"
            aria-label="Fechar anexos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            onClick={onClose}
            className="absolute inset-0 z-40 cursor-default bg-[#3B2A78]/18 backdrop-blur-[2px]"
          />
          <motion.div
            key="attach-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="attach-sheet-title"
            initial={Animations.bottomSheet.initial}
            animate={Animations.bottomSheet.animate}
            exit={Animations.bottomSheet.exit}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.38 }}
            onDragEnd={(_, info) => {
              if (shouldDismissDrag(info)) onClose();
            }}
            className="absolute inset-x-0 bottom-0 z-50"
            style={{ filter: "drop-shadow(0 -18px 28px rgba(108, 59, 255, 0.12))" }}
          >
            <div className="relative">
              <CurvedDockBackground />
              <div
                className="absolute inset-x-0 top-0 z-10 h-[4.5rem] cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => dragControls.start(event)}
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="absolute left-1/2 top-1 z-20 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-white text-primary shadow-[0_10px_22px_rgba(108,59,255,0.16)] transition-transform active:scale-[0.96]"
              >
                <X className="h-4 w-4" strokeWidth={IconConfig.strokeWidth.bold} />
              </button>
              <div className="relative px-3 pb-6 pt-[4.35rem] min-[380px]:px-4">
                <div className="flex justify-center">
                  <span className="h-1 w-10 rounded-full bg-primary/15" />
                </div>
                <h2
                  id="attach-sheet-title"
                  className="mt-3 text-center text-sm font-semibold tracking-[-0.01em] text-foreground/80"
                >
                  Anexar
                </h2>
                <ul className="mx-auto mt-5 grid w-full max-w-[22rem] grid-cols-2 gap-x-3 gap-y-5 min-[360px]:grid-cols-4">
                  {ATTACHMENT_OPTIONS.map((opt, index) => {
                    const Icon = OPTION_ICONS[opt.kind] ?? FileText;
                    return (
                      <motion.li
                        key={opt.kind}
                        custom={index}
                        variants={itemStagger}
                        initial="hidden"
                        animate="visible"
                        className="flex min-w-0 justify-center"
                      >
                        <button
                          type="button"
                          onClick={() => onSelect(opt.kind)}
                          aria-label={opt.label}
                          className="flex min-h-[72px] w-full flex-col items-center gap-1.5 rounded-[22px] px-0.5 py-1 outline-none transition-transform active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <span
                            className="grid h-12 w-12 place-items-center rounded-full bg-white text-primary"
                            style={{ boxShadow: Shadows.soft }}
                          >
                            <Icon className="h-5 w-5" strokeWidth={IconConfig.strokeWidth.regular} />
                          </span>
                          <span className="max-w-full text-center text-[10px] font-medium leading-tight text-muted-foreground min-[360px]:text-[11px]">
                            {opt.label}
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <span ref={sentinelRef} hidden />
      {host ? createPortal(sheet, host) : null}
    </>
  );
}

function CurvedDockBackground(): ReactNode {
  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        viewBox="0 0 390 92"
        preserveAspectRatio="none"
        aria-hidden
        className="absolute inset-x-0 top-0 h-[5.75rem] w-full"
      >
        <path
          d="M0 92 V46 C58 46 96 10 195 10 S332 46 390 46 V92 Z"
          fill="url(#attach-dock-fill)"
        />
        <defs>
          <linearGradient id="attach-dock-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBFAFF" />
            <stop offset="100%" stopColor={Colors.card} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-x-0 bottom-0 top-[4.35rem] bg-gradient-to-b from-[#FBFAFF] to-white" />
    </div>
  );
}
