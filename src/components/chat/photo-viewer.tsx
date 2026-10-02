import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { IconConfig } from "@/theme";
import { saveChatPhotoFile, shareChatPhotoFile } from "@/lib/media/share-local-photo";
import {
  clampPan,
  clampScale,
  containedImageSize,
  nextDoubleTapScale,
  PHOTO_VIEWER_HIDE_CONTROLS_MS,
  pointerDistance,
  shouldCloseOnSwipe,
  type PhotoPoint,
  type PhotoSize,
} from "@/lib/media/photo-viewer-transform";

interface PhotoViewerProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  mediaId?: string | null;
  originRect?: DOMRect | null;
}

export function PhotoViewer({
  isOpen,
  onClose,
  src,
  alt = "Foto",
  mediaId,
}: PhotoViewerProps) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [controls, setControls] = useState(true);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<PhotoPoint>({ x: 0, y: 0 });
  const [dragY, setDragY] = useState(0);
  const [natural, setNatural] = useState<PhotoSize>({ width: 0, height: 0 });
  const [viewport, setViewport] = useState<PhotoSize>({ width: 0, height: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointers = useRef(new Map<number, PhotoPoint>());
  const pinch = useRef({ distance: 0, scale: 1 });
  const dragging = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    lastAt: number;
  } | null>(null);
  const lastTap = useRef<{ at: number; x: number; y: number } | null>(null);
  const historyPushed = useRef(false);

  closeRef.current = onClose;

  useLayoutEffect(() => {
    const node =
      sentinelRef.current?.closest("[data-phone-stage]") ??
      sentinelRef.current?.closest("main");
    if (node instanceof HTMLElement) setHost(node);
  }, [isOpen]);

  const fitted = containedImageSize(natural.width, natural.height, viewport.width, viewport.height);

  const armHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), PHOTO_VIEWER_HIDE_CONTROLS_MS);
  }, []);

  const revealControls = useCallback(() => {
    setControls(true);
    armHide();
  }, [armHide]);

  const dismiss = useCallback(() => {
    if (historyPushed.current) {
      historyPushed.current = false;
      history.back();
      return;
    }
    closeRef.current();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      setDragY(0);
      setControls(true);
      return;
    }
    revealControls();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let active = true;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    const onPop = () => {
      historyPushed.current = false;
      if (active) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    history.pushState({ connexyPhotoViewer: true }, "");
    historyPushed.current = true;
    return () => {
      active = false;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (historyPushed.current) {
        historyPushed.current = false;
        history.back();
      }
    };
  }, [dismiss, isOpen, revealControls]);

  useEffect(() => {
    if (!isOpen || !stageRef.current) return;
    const node = stageRef.current;
    const measure = () => setViewport({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isOpen]);

  const applyPan = useCallback(
    (x: number, y: number, nextScale = scale) => {
      setPan(clampPan(x, y, nextScale, fitted, viewport));
    },
    [fitted, scale, viewport],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [first, second] = [...pointers.current.values()];
      pinch.current = { distance: pointerDistance(first, second), scale };
      dragging.current = null;
      return;
    }
    dragging.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
      lastAt: performance.now(),
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2) {
      const [first, second] = [...pointers.current.values()];
      const distance = pointerDistance(first, second);
      if (pinch.current.distance > 0) {
        const next = clampScale(pinch.current.scale * (distance / pinch.current.distance));
        setScale(next);
        applyPan(pan.x, pan.y, next);
      }
      setDragY(0);
      return;
    }
    const drag = dragging.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.lastAt = performance.now();
    if (scale > 1.02) {
      applyPan(drag.panX + dx, drag.panY + dy);
      setDragY(0);
      return;
    }
    setDragY(Math.max(0, dy));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    const drag = dragging.current;
    dragging.current = null;
    if (pointers.current.size < 2) pinch.current.distance = 0;

    if (scale <= 1.02 && drag) {
      const elapsed = Math.max(performance.now() - drag.lastAt, 16);
      const velocity = ((event.clientY - drag.y) / elapsed) * 1000;
      if (shouldCloseOnSwipe(dragY, velocity, scale)) {
        dismiss();
        return;
      }
      setDragY(0);
    }

    const now = performance.now();
    const tap = lastTap.current;
    if (
      tap &&
      now - tap.at < 320 &&
      Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 28
    ) {
      lastTap.current = null;
      const next = nextDoubleTapScale(scale);
      setScale(next);
      applyPan(0, 0, next);
      revealControls();
      return;
    }
    lastTap.current = { at: now, x: event.clientX, y: event.clientY };
    if (scale <= 1.02 && dragY < 12) revealControls();
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const next = clampScale(scale - event.deltaY * 0.002);
    setScale(next);
    applyPan(pan.x, pan.y, next);
  };

  async function handleSave() {
    try {
      await saveChatPhotoFile({ mediaId, src });
      toast.success("✓ Foto salva");
    } catch {
      toast.error("Não foi possível salvar a foto.");
    }
  }

  async function handleShare() {
    try {
      const result = await shareChatPhotoFile({ mediaId, src });
      if (result === "copied") toast.success("Foto copiada.");
      if (result === "saved") toast.success("✓ Foto salva");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Não foi possível compartilhar a foto.");
    }
  }

  const overlay = 1 - Math.min(dragY / 340, 0.42);

  const sheet = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="photo-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Foto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="absolute inset-0 z-[120] overflow-hidden text-white"
        >
          <div
            className="absolute inset-0 bg-[#0B0718]"
            style={{ opacity: 0.94 * overlay }}
            aria-hidden
          />
          <div
            ref={stageRef}
            className="relative flex h-full min-h-0 w-full touch-none items-center justify-center overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            <motion.img
              src={src}
              alt={alt}
              draggable={false}
              onLoad={(event) => {
                setNatural({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
              }}
              initial={{ opacity: 0.72, scale: 0.88 }}
              animate={{
                opacity: 1,
                scale,
                x: pan.x,
                y: pan.y + dragY,
              }}
              exit={{ opacity: 0, scale: 0.96, y: 28 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="max-h-full max-w-full select-none object-contain"
              style={{
                width: fitted.width || undefined,
                height: fitted.height || undefined,
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: controls ? 1 : 0, y: controls ? 0 : -8 }}
            className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-start px-4 pt-[max(0.85rem,env(safe-area-inset-top))]"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar"
              tabIndex={controls ? 0 : -1}
              className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/40 text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl transition active:scale-95 disabled:pointer-events-none"
              style={{ pointerEvents: controls ? "auto" : "none" }}
            >
              <X className="h-4 w-4" strokeWidth={IconConfig.strokeWidth.bold} />
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: controls ? 1 : 0, y: controls ? 0 : 12 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div
              className="flex items-center gap-1 rounded-full border border-white/20 bg-black/40 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl"
              style={{ pointerEvents: controls ? "auto" : "none" }}
            >
              <button
                type="button"
                onClick={() => void handleSave()}
                aria-label="Salvar"
                tabIndex={controls ? 0 : -1}
                className="inline-flex h-11 min-w-[7.5rem] items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition active:scale-[0.97]"
              >
                <Download className="h-4 w-4" strokeWidth={IconConfig.strokeWidth.regular} />
                Salvar
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                aria-label="Compartilhar"
                tabIndex={controls ? 0 : -1}
                className="inline-flex h-11 min-w-[7.5rem] items-center justify-center gap-1.5 rounded-full bg-white/16 px-4 text-sm font-semibold text-white transition active:scale-[0.97]"
              >
                <Share2 className="h-4 w-4" strokeWidth={IconConfig.strokeWidth.regular} />
                Compartilhar
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <span ref={sentinelRef} hidden />
      {host ? createPortal(sheet, host) : isOpen ? sheet : null}
    </>
  );
}
