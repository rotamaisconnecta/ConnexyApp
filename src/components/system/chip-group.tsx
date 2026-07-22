import { cn } from "@/lib/utils";
import { Chip } from "./chip";

interface ChipItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ChipGroupProps {
  chips: ChipItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  multiple?: boolean;
  className?: string;
}

export function ChipGroup({
  chips,
  selectedIds,
  onToggle,
  multiple = true,
  className,
}: ChipGroupProps) {
  const handleToggle = (id: string) => {
    if (!multiple) {
      if (selectedIds.includes(id)) {
        onToggle(id);
      } else {
        if (selectedIds.length > 0) {
          onToggle(selectedIds[0]);
        }
        onToggle(id);
      }
    } else {
      onToggle(id);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          label={chip.label}
          icon={chip.icon}
          selected={selectedIds.includes(chip.id)}
          onClick={() => handleToggle(chip.id)}
        />
      ))}
    </div>
  );
}
