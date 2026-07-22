import { Inbox } from "lucide-react";

interface FeedEmptyProps {
  filter: string;
}

export function FeedEmpty({ filter }: FeedEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-display text-base font-bold">Nada por aqui</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-[240px]">
        {filter === "ALL"
          ? "Quando houver novidades no seu feed, elas aparecerão aqui."
          : `Nenhum conteúdo encontrado para este filtro.`}
      </p>
    </div>
  );
}
