import { Smile, Camera, Mic, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyChatProps {
  participantName?: string;
}

const features = [
  { icon: "💬", label: "Mensagens de texto", desc: "Converse em tempo real" },
  { icon: "📷", label: "Fotos e vídeos", desc: "Compartilhe momentos" },
  { icon: "🎤", label: "Áudio", desc: "Mensagens de voz" },
  { icon: "📍", label: "Localização", desc: "Encontros próximos" },
];

export function EmptyChat({ participantName }: EmptyChatProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center mb-4">
        <span className="text-3xl">💬</span>
      </div>

      <h3 className="font-display text-base font-bold">
        {participantName ? `Inicie uma conversa com ${participantName}` : "Comece uma conversa"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-[260px]">
        {participantName
          ? "Envie uma mensagem para quebrar o gelo!"
          : "Escolha uma conversa para começar a interagir."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-[280px]">
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface p-3"
          >
            <span className="text-xl">{f.icon}</span>
            <span className="text-[11px] font-semibold">{f.label}</span>
            <span className="text-[10px] text-muted-foreground">{f.desc}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
