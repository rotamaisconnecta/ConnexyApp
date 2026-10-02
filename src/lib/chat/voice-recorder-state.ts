export const VoiceRecorderPhase = {
  IDLE: "idle",
  RECORDING: "recording",
  PREVIEW: "preview",
  SENDING: "sending",
  SENT: "sent",
  ERROR: "error",
} as const;

export type VoiceRecorderPhaseValue =
  (typeof VoiceRecorderPhase)[keyof typeof VoiceRecorderPhase];

export type VoiceRecorderEvent =
  | "start"
  | "stop"
  | "send"
  | "discard"
  | "cancel"
  | "fail"
  | "sent";

export function reduceVoiceRecorderPhase(
  phase: VoiceRecorderPhaseValue,
  event: VoiceRecorderEvent,
): VoiceRecorderPhaseValue {
  switch (event) {
    case "start":
      return phase === VoiceRecorderPhase.IDLE || phase === VoiceRecorderPhase.ERROR
        ? VoiceRecorderPhase.RECORDING
        : phase;
    case "stop":
      return phase === VoiceRecorderPhase.RECORDING ? VoiceRecorderPhase.PREVIEW : phase;
    case "send":
      return phase === VoiceRecorderPhase.PREVIEW ? VoiceRecorderPhase.SENDING : phase;
    case "sent":
      return phase === VoiceRecorderPhase.SENDING ? VoiceRecorderPhase.SENT : phase;
    case "fail":
      return VoiceRecorderPhase.ERROR;
    case "discard":
    case "cancel":
      return VoiceRecorderPhase.IDLE;
    default:
      return phase;
  }
}
