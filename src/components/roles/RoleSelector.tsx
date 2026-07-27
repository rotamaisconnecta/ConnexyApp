import { useNavigate } from "@tanstack/react-router";
import { UserRole } from "@/lib/roles/roles-types";

import RoleCard from "./RoleCard";
import RoleGrid from "./RoleGrid";

import { getStoredRoles, addRole } from "@/lib/roles/roles-storage";

export default function RoleSelector() {
  const navigate = useNavigate();
  const roles = getStoredRoles();

  const hasRole = (role: UserRole) => roles.roles.includes(role);

  function activateDriver() {
    if (!hasRole(UserRole.DRIVER)) addRole(UserRole.DRIVER);
    navigate({ to: "/driver/cadastro" as never });
  }

  function activateBusiness() {
    if (!hasRole(UserRole.BUSINESS)) addRole(UserRole.BUSINESS);
    navigate({ to: "/business/cadastro" as never });
  }

  function activateEvents() {
    if (!hasRole(UserRole.EVENT_CREATOR)) addRole(UserRole.EVENT_CREATOR);
    navigate({ to: "/events/cadastro" as never });
  }

  function activatePlace() {
    if (!hasRole(UserRole.PLACE_OWNER)) addRole(UserRole.PLACE_OWNER);
    navigate({ to: "/places/cadastro" as never });
  }

  function activateCreator() {
    if (!hasRole(UserRole.REELS_CREATOR)) addRole(UserRole.REELS_CREATOR);
    navigate({ to: "/create/reel" });
  }

  return (
    <RoleGrid>
      <RoleCard
        role={UserRole.DRIVER}
        title="Quero ser Motorista"
        description="Receba solicitações de corridas e aumente sua renda."
        active={hasRole(UserRole.DRIVER)}
        onClick={activateDriver}
      />
      <RoleCard
        role={UserRole.BUSINESS}
        title="Cadastrar Empresa"
        description="Publique ofertas, promoções e aumente sua visibilidade."
        active={hasRole(UserRole.BUSINESS)}
        onClick={activateBusiness}
      />
      <RoleCard
        role={UserRole.EVENT_CREATOR}
        title="Criar Eventos"
        description="Organize eventos e receba check-ins dos participantes."
        active={hasRole(UserRole.EVENT_CREATOR)}
        onClick={activateEvents}
      />
      <RoleCard
        role={UserRole.PLACE_OWNER}
        title="Cadastrar Local"
        description="Adicione restaurantes, bares, hotéis e qualquer estabelecimento."
        active={hasRole(UserRole.PLACE_OWNER)}
        onClick={activatePlace}
      />
      <RoleCard
        role={UserRole.REELS_CREATOR}
        title="Criador de Conteúdo"
        description="Publique vídeos, reels e momentos."
        active={hasRole(UserRole.REELS_CREATOR)}
        onClick={activateCreator}
      />
    </RoleGrid>
  );
}
