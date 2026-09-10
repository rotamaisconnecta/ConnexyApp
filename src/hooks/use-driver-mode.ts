/* =========================================================
   use-driver-mode.ts — Governança do Modo Motorista (Fase 6.3).
   DERIVA o estado dos stores existentes (roles-storage +
   driver-application-storage + dispatch store). Nenhum estado
   persistido novo. Reage aos eventos roleChanged e
   driverApplicationChanged já existentes.
   Não altera o núcleo Trip/Dispatcher.
========================================================= */

import { useEffect, useState } from "react";
import { isDemoMode } from "@/lib/demo/demo-config";
import {
  getDriverApplication,
  type DriverApplicationStatus,
} from "@/lib/driver/driver-application-storage";
import { setDemoDriverOnline } from "@/lib/mobility/dispatch/dispatcher";
import {
  getActiveAssignmentForDriver,
  getDriverById,
  subscribe as subscribeDispatch,
} from "@/lib/mobility/dispatch/dispatcher-store";
import { DEMO_DRIVER_ID } from "@/lib/mobility/dispatch/demo-fleet";
import { addRole, getStoredRoles, restoreLastMode, setActiveMode } from "@/lib/roles/roles-storage";
import { UserRole } from "@/lib/roles/roles-types";

export interface DriverModeState {
  /** Motorista pode operar (aprovado; demo sempre aprovado). */
  approved: boolean;
  /** Usuário possui (ou, no demo, é tratado como possuindo) a role de motorista. */
  hasDriverRole: boolean;
  /** Modo Motorista está ativo no momento. */
  isDriverMode: boolean;
  /** Motorista demo está online (recebendo ofertas). */
  isOnline: boolean;
  /** Status bruto do cadastro do motorista. */
  driverStatus: DriverApplicationStatus;
}

function computeState(): DriverModeState {
  const demo = isDemoMode();
  const roles = getStoredRoles();
  const application = getDriverApplication();
  const driver = getDriverById(DEMO_DRIVER_ID);
  return {
    approved: demo || application.status === "approved",
    hasDriverRole: demo || roles.roles.includes(UserRole.DRIVER),
    isDriverMode: roles.activeMode === UserRole.DRIVER,
    isOnline: driver ? driver.status !== "offline" : false,
    driverStatus: demo ? "approved" : application.status,
  };
}

export function useDriverMode(): DriverModeState {
  const [state, setState] = useState<DriverModeState>(() => computeState());

  useEffect(() => {
    const emit = () => setState(computeState());
    const unsubscribeDispatch = subscribeDispatch(emit);
    window.addEventListener("roleChanged", emit);
    window.addEventListener("driverApplicationChanged", emit);
    return () => {
      unsubscribeDispatch();
      window.removeEventListener("roleChanged", emit);
      window.removeEventListener("driverApplicationChanged", emit);
    };
  }, []);

  return state;
}

/* ─── Guardas de autorização (camada de aplicação) ─────────
   A política de mobilidade continua no dispatcher; aqui fica
   somente a autorização: motorista não aprovado NUNCA opera. */

export function canOperateAsDriver(): boolean {
  return isDemoMode() || getDriverApplication().status === "approved";
}

/** Motorista está prestes a receber/executar uma corrida (bloqueia troca de modo). */
export function isDriverInActiveRide(): boolean {
  if (typeof window === "undefined") return false;
  const driver = getDriverById(DEMO_DRIVER_ID);
  if (
    driver &&
    (driver.status === "offering" || driver.status === "accepted" || driver.status === "busy")
  ) {
    return true;
  }
  return Boolean(getActiveAssignmentForDriver(DEMO_DRIVER_ID));
}

/** Coloca o motorista demo offline (sem contradição "passageiro + online"). */
export function forceDemoDriverOffline(driverId: string = DEMO_DRIVER_ID): void {
  const driver = getDriverById(driverId);
  if (driver && driver.status !== "offline") setDemoDriverOnline(driverId, false);
}

/**
 * Sai do Modo Motorista com segurança: exige não haver corrida
 * ativa e remove o driver demo do ar antes de trocar o modo.
 * Retorna false se a troca for incoerente (corrida ativa).
 */
export function switchToPassengerMode(): boolean {
  if (isDriverInActiveRide()) return false;
  forceDemoDriverOffline();
  setActiveMode(UserRole.USER);
  window.dispatchEvent(new Event("roleChanged"));
  return true;
}

/** Restaura o último modo no boot (consumo real de restoreLastMode). */
export function restoreModeOnBoot(): void {
  if (typeof window === "undefined") return;
  if (isDemoMode()) {
    const state = getStoredRoles();
    if (
      state.lastMode === UserRole.DRIVER &&
      state.activeMode !== UserRole.DRIVER &&
      !state.roles.includes(UserRole.DRIVER)
    ) {
      addRole(UserRole.DRIVER);
    }
  }
  restoreLastMode();
  window.dispatchEvent(new Event("roleChanged"));
}
