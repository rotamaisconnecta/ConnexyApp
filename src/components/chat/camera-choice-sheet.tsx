import { Camera, Video } from "lucide-react";
import { motion } from "framer-motion";

export function CameraChoiceSheet({
  onCapturePhoto,
  onRecordVideo,
  onClose,
}: {
  onCapturePhoto: () => void;
  onRecordVideo: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-full left-0 right-0 z-50 mx-3 mb-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-elegant"
      >
        <div className="flex justify-center py-2">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>
        <p className="px-4 pb-2 text-xs font-semibold text-muted-foreground">Câmera</p>
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          <button
            type="button"
            onClick={onCapturePhoto}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-border p-3 transition-colors hover:bg-accent"
          >
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-[11px] font-medium">Capturar foto</span>
          </button>
          <button
            type="button"
            onClick={onRecordVideo}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-border p-3 transition-colors hover:bg-accent"
          >
            <Video className="h-6 w-6 text-primary" />
            <span className="text-[11px] font-medium">Gravar vídeo</span>
          </button>
        </div>
      </motion.div>
    </>
  );
}
