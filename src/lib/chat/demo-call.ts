export const DEMO_CALL_FEEDBACK = "Chamadas reais ainda não estão configuradas neste modo demo.";

export function triggerDemoCallFeedback(notify: (message: string) => void): void {
  notify(DEMO_CALL_FEEDBACK);
}
