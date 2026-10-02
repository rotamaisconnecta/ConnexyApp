export type CaptureDeviceError =
  | "denied"
  | "missing"
  | "busy"
  | "unsupported"
  | "unknown";

export function captureDeviceError(error: unknown): CaptureDeviceError {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "missing";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return "unsupported";
  return "unknown";
}

export function captureDeviceMessage(code: CaptureDeviceError): string {
  switch (code) {
    case "denied":
      return "Permissão negada. Autorize a câmera ou o microfone para continuar.";
    case "missing":
      return "Nenhum dispositivo de câmera ou microfone foi encontrado.";
    case "busy":
      return "A câmera ou o microfone já está em uso por outro aplicativo.";
    case "unsupported":
      return "Este navegador não permite capturar mídia localmente.";
    default:
      return "Não foi possível acessar a câmera ou o microfone.";
  }
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function pickRecorderMimeType(candidates: readonly string[]): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return undefined;
  }
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export const AUDIO_RECORDER_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
] as const;

export const VIDEO_RECORDER_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
] as const;
