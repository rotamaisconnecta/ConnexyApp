import { describe, expect, test } from "bun:test";
import {
  isAppBottomNavVisible,
  resetAppRouteScroll,
  resetGlobalShellScroll,
  routeOwnsScroll,
} from "../src/lib/shell/app-shell";

describe("Phase 1A shell navigation", () => {
  test("keeps the global BottomNav available on primary and immersive routes", () => {
    const routes = [
      "/",
      "/home",
      "/discover",
      "/create",
      "/chat",
      "/chat/abc",
      "/profile",
      "/perfil",
      "/ride",
      "/ride/request",
      "/ride/active",
      "/solicitacao/42",
    ];

    for (const pathname of routes) {
      expect(isAppBottomNavVisible(pathname)).toBe(true);
    }
  });

  test("isolates internal scroll only on screens that already own it", () => {
    expect(routeOwnsScroll("/chat")).toBe(true);
    expect(routeOwnsScroll("/chat/abc")).toBe(true);
    expect(routeOwnsScroll("/solicitacao/42")).toBe(true);
    expect(routeOwnsScroll("/ride/active")).toBe(true);
    expect(routeOwnsScroll("/destino")).toBe(true);
    expect(routeOwnsScroll("/create/photo")).toBe(true);
    expect(routeOwnsScroll("/home")).toBe(false);
    expect(routeOwnsScroll("/profile")).toBe(false);
    expect(routeOwnsScroll("/perfil")).toBe(false);
    expect(routeOwnsScroll("/ride/history")).toBe(false);
  });

  test("resets only the global scroller and never the chat thread", () => {
    let globalTop = 180;
    let threadTop = 640;

    resetGlobalShellScroll({
      scrollTo: ({ top }) => {
        globalTop = top ?? globalTop;
      },
    });

    resetGlobalShellScroll({
      hasAttribute: (name) => name === "data-chat-thread",
      scrollTo: ({ top }) => {
        threadTop = top ?? threadTop;
      },
    });

    expect(globalTop).toBe(0);
    expect(threadTop).toBe(640);
  });

  test("resets nested page scrollers but never the chat thread", () => {
    const nested = { top: 240, thread: 510 };
    const root = {
      hasAttribute: () => false,
      scrollTo: ({ top }: ScrollToOptions) => {
        nested.top = top === 0 ? 0 : nested.top;
      },
      querySelectorAll: () => [
        {
          hasAttribute: (name: string) => name === "data-chat-thread",
          closest: () => null,
          scrollTo: ({ top }: ScrollToOptions) => {
            if (top === 0) nested.thread = 0;
          },
        },
        {
          hasAttribute: () => false,
          closest: () => null,
          scrollTo: ({ top }: ScrollToOptions) => {
            if (top === 0) nested.top = 0;
          },
        },
      ],
    } as unknown as HTMLElement;

    resetAppRouteScroll(root);
    expect(nested.top).toBe(0);
    expect(nested.thread).toBe(510);
  });
});
