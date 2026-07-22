import { Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageStatusValue } from "@/lib/chat/chat-types";
import { MessageStatus } from "@/lib/chat/chat-types";
import { getStatusColor } from "@/lib/chat/message-status";

interface ReadStatusProps {
  status: MessageStatusValue;
}

export function ReadStatus({ status }: ReadStatusProps) {
  const color = getStatusColor(status);

  return (
    <span className={cn("inline-flex items-center", color)} aria-label={status}>
      {status === MessageStatus.SENDING && <Clock className="h-3 w-3" />}
      {status === MessageStatus.SENT && <Check className="h-3 w-3" />}
      {status === MessageStatus.DELIVERED && <CheckCheck className="h-3 w-3" />}
      {status === MessageStatus.READ && <CheckCheck className="h-3 w-3" />}
    </span>
  );
}
