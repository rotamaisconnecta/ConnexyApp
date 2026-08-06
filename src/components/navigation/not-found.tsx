import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";

interface NotFoundStateProps {
  title: string;
  description: string;
  fallbackTo?: string;
  fallbackLabel?: string;
}

export function NotFoundState({
  title,
  description,
  fallbackTo = "/home",
  fallbackLabel = "Voltar",
}: NotFoundStateProps) {
  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <BackButton
          fallbackTo={fallbackTo}
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
        <span className="h-12 w-12 grid place-items-center rounded-full bg-secondary text-muted-foreground">
          <SearchX className="h-5 w-5" />
        </span>
        <h2 className="font-display font-bold text-lg">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
        <Link
          to={fallbackTo}
          className="mt-2 h-11 px-6 grid place-items-center rounded-full bg-gradient-brand text-white font-semibold text-sm shadow-elegant"
        >
          {fallbackLabel}
        </Link>
      </div>
    </div>
  );
}
