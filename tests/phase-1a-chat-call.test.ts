import { describe, expect, test } from "bun:test";
import { DEMO_CALL_FEEDBACK, triggerDemoCallFeedback } from "../src/lib/chat/demo-call";

describe("Phase 1A chat call action", () => {
  test("produces honest local feedback without simulating a real call", () => {
    const messages: string[] = [];

    triggerDemoCallFeedback((message) => messages.push(message));

    expect(messages).toEqual([DEMO_CALL_FEEDBACK]);
    expect(DEMO_CALL_FEEDBACK).toContain("não estão configuradas");
    expect(DEMO_CALL_FEEDBACK).toContain("modo demo");
    expect(DEMO_CALL_FEEDBACK.toLowerCase()).not.toContain("chamada iniciada");
    expect(DEMO_CALL_FEEDBACK.toLowerCase()).not.toContain("em ligação");
  });
});
