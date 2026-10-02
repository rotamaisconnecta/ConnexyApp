/* =========================================================
   app-shell.ts — Regras do shell global (scroll + BottomNav).
   Uma camada de scroll no layout `_app`, BottomNav sempre
   visível nas rotas autenticadas, e reset só do scroller
   global (nunca do thread de mensagens da conversa).
========================================================= */

export const BOTTOM_NAV_HEIGHT = "4.75rem";

export const APP_SCROLL_PADDING_BOTTOM =
  "calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 4.75rem))";

export function isRideFlowPath(pathname: string): boolean {
  return pathname === "/destino" || /^\/ride(\/request|\/matching|\/active|\/)?$/.test(pathname);
}

/** Product rule: the global BottomNav stays available on every `_app` screen. */
export function isAppBottomNavVisible(_pathname: string): boolean {
  return true;
}

export function routeOwnsScroll(pathname: string): boolean {
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return true;
  if (pathname.startsWith("/solicitacao/")) return true;
  if (isRideFlowPath(pathname)) return true;
  if (pathname === "/create" || pathname.startsWith("/create/")) return true;
  return false;
}

export function resetGlobalShellScroll(
  element: {
    scrollTo: (options: ScrollToOptions) => void;
    hasAttribute?: (name: string) => boolean;
  } | null,
): void {
  if (!element) return;
  if (element.hasAttribute?.("data-chat-thread")) return;
  element.scrollTo({ top: 0, behavior: "auto" });
}

function isChatThreadElement(element: {
  hasAttribute?: (name: string) => boolean;
  closest?: (selector: string) => Element | null;
}): boolean {
  if (element.hasAttribute?.("data-chat-thread")) return true;
  return Boolean(element.closest?.("[data-chat-thread]"));
}

/** Reset the app scroller and nested page scrollers, except the live chat thread. */
export function resetAppRouteScroll(root: HTMLElement | null): void {
  resetGlobalShellScroll(root);
  if (typeof window !== "undefined") {
    window.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    if (window.history && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }
  if (typeof document !== "undefined") {
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }
  if (!root) return;
  const nested = root.querySelectorAll("[class*='overflow-y-auto'], [class*='overflow-auto']");
  nested.forEach((node) => {
    const element = node as HTMLElement;
    if (isChatThreadElement(element)) return;
    element.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
  });
}
