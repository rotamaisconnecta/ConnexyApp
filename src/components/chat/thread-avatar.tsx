import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <div className={cn("relative shrink-0", className)}>
      <Avatar className="h-12 w-12 rounded-2xl">
        {photo && <AvatarImage src={photo} alt={`Foto de ${conversation.participant.name}`} />}
        <AvatarFallback className="rounded-2xl bg-gradient-brand text-sm font-bold text-white">
          {conversation.initials}
        </AvatarFallback>
      </Avatar>
      {conversation.isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <PresenceDot online size={10} />
        </span>
      )}
    </div>
  );
}
