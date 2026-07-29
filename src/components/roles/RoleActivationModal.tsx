import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { X, ArrowRight, Sparkles, Car, Store, CalendarDays, MapPin } from "lucide-react";

import { UserRole } from "@/lib/roles/roles-types";
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
    subtitle: string;
    description: string;
    gradient: string;
    createRoute: string;
    createLabel: string;
  }
> = {
  [UserRole.DRIVER]: {
    icon: Car,
    title: "Vamos começar a dirigir",
    subtitle: "Mobilidade",
    description:
      "Você ainda não oferece corridas. Cadastre-se como motorista agora e comece a receber solicitações.",
    gradient: "linear-gradient(135deg, #22C55E, #16A34A)",
    createRoute: "/driver",
    createLabel: "Começar a dirigir",
  },
  [UserRole.BUSINESS]: {
    icon: Store,
    title: "Vamos criar seu negócio",
    subtitle: "Negócios",
    description:
      "Cadastre sua empresa ou estabelecimento para publicar ofertas, divulgar seus serviços e atrair clientes.",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    createRoute: "/create/place-business",
    createLabel: "Criar negócio",
  },
  [UserRole.EVENT_CREATOR]: {
    icon: CalendarDays,
    title: "Vamos criar seu evento",
    subtitle: "Eventos",
    description:
      "Organize e promova seus eventos no Connexy. Venda ingressos, receba check-ins e engaje seu público.",
    gradient: "linear-gradient(135deg, #EC4899, #DB2777)",
    createRoute: "/create/event",
    createLabel: "Criar evento",
  },
  [UserRole.PLACE_OWNER]: {
    icon: MapPin,
    title: "Vamos cadastrar seu local",
    subtitle: "Locais",
    description:
      "Adicione seu estabelecimento ao mapa inteligente do Connexy e seja encontrado por clientes próximos.",
    gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
    createRoute: "/create/place",
    createLabel: "Cadastrar local",
  },
};

export default function RoleActivationModal({ open, role, onClose }: RoleActivationModalProps) {
  const navigate = useNavigate();
  const data = roleData[role];
  if (!data) return null;

  const Icon = data.icon;

  function handleCreate() {
    onClose();
    navigate({ to: data.createRoute as never });
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
                    <span className="text-xs opacity-90">{data.subtitle}</span>
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
                onClick={handleCreate}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 text-white font-semibold text-sm"
                style={{
                  borderRadius: Radius.md,
                  background: Gradients.primary,
                  boxShadow: Shadows.floatingButton,
                }}
              >
                {data.createLabel}
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
                Agora não
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
