import { Route } from "lucide-react";

interface EmptyHistoryProps {
  message?: string;
  submessage?: string;
}

export function EmptyHistory({
  message = "Nenhuma viagem ainda",
  submessage = "Suas viagens aparecerão aqui depois que você usar o RotaMais.",
}: EmptyHistoryProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center">
        <Route className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-display text-base font-bold">{message}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-[240px]">{submessage}</p>
    </div>
  );
}
