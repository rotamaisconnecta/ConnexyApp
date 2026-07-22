import { cn } from "@/lib/utils";
import type { CheckinUser } from "@/lib/event-checkin/checkin-types";

interface ParticipantsPreviewProps {
  users: CheckinUser[];
  maxVisible?: number;
}

const OVERLAP_OFFSETS = ["", "-ml-2", "-ml-2", "-ml-2", "-ml-2", "-ml-2"];

export function ParticipantsPreview({ users, maxVisible = 4 }: ParticipantsPreviewProps) {
  const visible = users.slice(0, maxVisible);
  const remaining = users.length - maxVisible;

  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {visible.map((user, i) => (
          <img
            key={user.id}
            src={user.photo}
            alt={user.name}
            className={cn(
              "h-8 w-8 rounded-full border-2 border-white object-cover",
              i > 0 && OVERLAP_OFFSETS[Math.min(i, OVERLAP_OFFSETS.length - 1)],
            )}
            style={{ zIndex: visible.length - i }}
          />
        ))}
      </div>

      {remaining > 0 && (
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center -ml-2 rounded-full bg-[#F4F1FF] text-[10px] font-bold text-primary",
            "border-2 border-white",
          )}
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
