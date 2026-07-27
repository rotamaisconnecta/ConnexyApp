import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Car, Store, CalendarDays, MapPin } from "lucide-react";

import { useNavigate } from "@tanstack/react-router";

import { UserRole } from "@/lib/roles/roles-types";

interface Props {
  open: boolean;
  role: UserRole;
  onClose: () => void;
}

const roleData = {
  DRIVER: {
    icon: Car,
    title: "Quero ser Motorista",
    description:
      "Cadastre-se como motorista para começar a receber solicitações de corridas e aumentar sua renda.",
    route: "/driver/cadastro",
    color: "from-violet-600 to-fuchsia-500",
  },
  BUSINESS: {
    icon: Store,
    title: "Cadastrar Empresa",
    description:
      "Cadastre sua empresa para publicar ofertas, promoções e divulgar seus serviços.",
    route: "/business/cadastro",
    color: "from-emerald-500 to-green-600",
  },
  EVENT_CREATOR: {
    icon: CalendarDays,
    title: "Criar Eventos",
    description:
      "Ative esta função para organizar eventos, vender ingressos e receber check-ins.",
    route: "/events/cadastro",
    color: "from-orange-500 to-red-500",
  },
  PLACE_OWNER: {
    icon: MapPin,
    title: "Cadastrar Local",
    description:
      "Adicione seu estabelecimento ao mapa inteligente do Connexy.",
    route: "/places/cadastro",
    color: "from-sky-500 to-blue-600",
  },
};

export default function RoleActivationModal({ open, role, onClose }: Props) {
  const navigate = useNavigate();
  const data = roleData[role as keyof typeof roleData];

  if (!data) return null;

  const Icon = data.icon;

  function activate() {
    onClose();
    navigate({ to: data.route as never });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className={`bg-gradient-to-r ${data.color} p-8 text-white relative`}>
              <button onClick={onClose} className="absolute top-4 right-4">
                <X />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Icon size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{data.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Sparkles size={16} />
                    <span className="text-sm">Nova funcionalidade</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="leading-7 text-muted-foreground">{data.description}</p>
              <button
                onClick={activate}
                className="mt-8 w-full rounded-2xl bg-violet-600 py-4 text-white font-semibold flex justify-center items-center gap-2 hover:bg-violet-700 transition"
              >
                Ativar agora
                <ArrowRight size={18} />
              </button>
              <button onClick={onClose} className="mt-3 w-full rounded-2xl border py-4">
                Agora não
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
