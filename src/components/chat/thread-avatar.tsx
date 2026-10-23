import { AuthenticatedAvatarImage } from "@/components/media/authenticated-avatar-image";
import { PresenceDot } from "@/components/presence-dot";
import { cn } from "@/lib/utils";
import type { MockConversation } from "@/lib/chat/mock-conversations";

interface ThreadAvatarProps {
  conversation: MockConversation;
  className?: string;
}

export function ThreadAvatar({ conversation, className }: ThreadAvatarProps) {
  const photo = conversation.participant.photo;

  return (
    <div className="relative shrink-0">
      <AuthenticatedAvatarImage
        profileId={conversation.participant.id}
        legacyUrl={photo}
        alt={`Foto de ${conversation.participant.name}`}
        className={cn("h-14 w-14 rounded-2xl object-cover", className)}
        fallback={
          <div
            className={cn(
              "grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-sm font-bold text-white",
              className,
            )}
          >
            {conversation.initials}
          </div>
        }
      />
      {conversation.isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <PresenceDot online size={10} />
        </span>
      )}
    </div>
  );
}
