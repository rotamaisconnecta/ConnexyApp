import { describe, expect, test } from "bun:test";
import {
  isAppBottomNavVisible,
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
});
