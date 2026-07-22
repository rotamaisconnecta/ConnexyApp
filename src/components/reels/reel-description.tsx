interface ReelDescriptionProps {
  text: string;
  expanded?: boolean;
  onToggle?: () => void;
}

export function ReelDescription({ text, expanded, onToggle }: ReelDescriptionProps) {
  if (!text) return null;

  return (
    <div className="max-w-[86%]">
      <p
        className={`text-white text-[13px] leading-snug drop-shadow ${expanded ? "" : "line-clamp-2"}`}
      >
        {text}
      </p>
      {onToggle && text.length > 120 && (
        <button
          onClick={onToggle}
          className="mt-0.5 text-[12px] font-semibold text-white/70 hover:text-white"
        >
          {expanded ? "ver menos" : "ver mais"}
        </button>
      )}
    </div>
  );
}
