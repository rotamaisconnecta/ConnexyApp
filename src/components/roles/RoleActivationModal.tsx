import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Car, Store, CalendarDays, MapPin } from "lucide-react";

import { UserRole, type RoleMode } from "@/lib/roles/roles-types";
import { addRole, setActiveMode } from "@/lib/roles/roles-storage";
import { Colors, Radius, Shadows, Gradients } from "@/theme";

interface RoleActivationModalProps {
  open: boolean;
  role: UserRole;
  onClose: () => void;
}

const roleData: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    description: string;
    gradient: string;
  }
> = {
  [UserRole.DRIVER]: {
    icon: Car,
    title: "Quero ser Motorista",
    description:
      "Cadastre-se como motorista para começar a receber solicitações de corridas e aumentar sua renda.",
    gradient: "linear-gradient(135deg, #22C55E, #16A34A)",
  },
  [UserRole.BUSINESS]: {
    icon: Store,
    title: "Cadastrar Empresa",
    description: "Cadastre sua empresa para publicar ofertas, promoções e divulgar seus serviços.",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
  },
  [UserRole.EVENT_CREATOR]: {
    icon: CalendarDays,
    title: "Criar Eventos",
    description: "Ative esta função para organizar eventos, vender ingressos e receber check-ins.",
    gradient: "linear-gradient(135deg, #EC4899, #DB2777)",
  },
  [UserRole.PLACE_OWNER]: {
    icon: MapPin,
    title: "Cadastrar Local",
    description: "Adicione seu estabelecimento ao mapa inteligente do Connexy.",
    gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
  },
};

export default function RoleActivationModal({ open, role, onClose }: RoleActivationModalProps) {
  const data = roleData[role];
  if (!data) return null;

  const Icon = data.icon;

  function handleActivate() {
    addRole(role);
    setActiveMode(role as RoleMode);
    onClose();
    window.dispatchEvent(new Event("roleChanged"));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
        >
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden"
            style={{
              borderRadius: Radius.lg,
              backgroundColor: Colors.card,
              boxShadow: Shadows.large,
            }}
          >
            <div
              className="relative px-6 pt-8 pb-6 text-white"
              style={{ background: data.gradient }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 grid place-items-center hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 flex items-center justify-center shrink-0"
                  style={{
                    borderRadius: Radius.md,
                    background: "rgba(255,255,255,0.2)",
                  }}
                >
                  <Icon size={28} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold leading-tight">{data.title}</h2>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Sparkles size={14} />
                    <span className="text-xs opacity-90">Nova funcionalidade</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <p className="text-sm leading-6" style={{ color: Colors.text.secondary }}>
                {data.description}
              </p>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleActivate}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 text-white font-semibold text-sm"
                style={{
                  borderRadius: Radius.md,
                  background: Gradients.primary,
                  boxShadow: Shadows.floatingButton,
                }}
              >
                Ativar agora
                <ArrowRight size={16} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="mt-3 w-full py-3.5 text-sm font-medium rounded-2xl transition-colors"
                style={{
                  color: Colors.text.secondary,
                  border: `1px solid ${Colors.border}`,
                }}
              >
                Cancelar
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
