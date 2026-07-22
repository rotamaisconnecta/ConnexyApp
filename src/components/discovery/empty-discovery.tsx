import { Inbox } from "lucide-react";

export function EmptyDiscovery() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-display text-base font-bold">Ninguém por perto</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-[240px]">
        Quando houver pessoas compatíveis na sua região, elas aparecerão aqui.
      </p>
    </div>
  );
}
