import { Camera } from "lucide-react";

interface PublisherCameraButtonProps {
  onClick?: () => void;
}

export function PublisherCameraButton({ onClick }: PublisherCameraButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 w-12 rounded-full bg-gradient-brand text-white grid place-items-center shadow-lg active:scale-95 transition-transform"
      aria-label="Abrir câmera"
    >
      <Camera className="h-5 w-5" />
    </button>
  );
}
