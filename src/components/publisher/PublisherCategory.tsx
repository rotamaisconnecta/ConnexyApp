interface PublisherCategoryProps {
  emoji: string;
  label: string;
}

export function PublisherCategory({ emoji, label }: PublisherCategoryProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}
