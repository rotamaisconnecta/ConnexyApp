import { cn } from "@/lib/utils";
import type { ChatMessage, QuickReaction } from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";
import { ReadStatus } from "./read-status";
import { ImageMessage } from "./image-message";
import { VideoMessage } from "./video-message";
import { AudioPlayer } from "./audio-player";
import { FileMessage } from "./file-message";
import { LocationMessage } from "./location-message";
import { QuickReactions } from "./quick-reactions";
import { formatMessageTime } from "@/lib/chat/chat-format";
import { getMessageAlignment } from "@/lib/chat/chat-utils";
import { getStatusColor } from "@/lib/chat/message-status";

interface MessageBubbleProps {
  message: ChatMessage;
  participantPhoto: string;
  grouped: boolean;
  onReaction?: (messageId: string, reaction: QuickReaction) => void;
  onRetry?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  participantPhoto,
  grouped,
  onReaction,
  onRetry,
}: MessageBubbleProps) {
  const alignment = getMessageAlignment(message);
  const isMe = alignment === "right";

  return (
    <div
      className={cn(
        "flex gap-2",
        isMe ? "justify-end" : "justify-start",
        grouped ? "mt-0.5" : "mt-2",
      )}
    >
      {!isMe && !grouped && (
        <img
          src={participantPhoto}
          alt=""
          className="h-6 w-6 rounded-lg object-cover mt-auto shrink-0"
        />
      )}
      {!isMe && grouped && <div className="w-6 shrink-0" />}

      <div className={cn("max-w-[75%] space-y-0.5", isMe && "items-end")}>
        <div
          className={cn(
            "relative rounded-2xl px-3 py-2 text-sm",
            isMe
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-surface border border-border text-foreground rounded-bl-md",
            message.kind === MessageKind.IMAGE && "p-0 border-0 bg-transparent",
            message.kind === MessageKind.VIDEO && "p-0 border-0 bg-transparent",
          )}
        >
          {renderContent(message)}

          {message.reaction && (
            <span className="absolute -bottom-2 right-2 text-sm bg-surface border border-border rounded-full px-1.5 py-0.5 shadow-soft">
              {message.reaction}
            </span>
          )}
        </div>

        <div
          className={cn("flex items-center gap-1.5 px-1", isMe ? "justify-end" : "justify-start")}
        >
          <span className={cn("text-[10px]", getStatusColor(message.status))}>
            {formatMessageTime(message.at)}
          </span>
          {isMe && <ReadStatus status={message.status} />}
        </div>

        {onReaction && (
          <QuickReactions
            messageId={message.id}
            currentReaction={message.reaction}
            onSelect={onReaction}
          />
        )}
      </div>
    </div>
  );
}

function renderContent(message: ChatMessage): React.ReactNode {
  switch (message.kind) {
    case MessageKind.TEXT:
      return <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>;

    case MessageKind.IMAGE:
      return (
        <ImageMessage
          url={message.url}
          caption={message.caption}
          width={message.width}
          height={message.height}
        />
      );

    case MessageKind.VIDEO:
      return (
        <VideoMessage
          url={message.url}
          thumbnail={message.thumbnail}
          durationSec={message.durationSec}
        />
      );

    case MessageKind.AUDIO:
      return <AudioPlayer durationSec={message.durationSec} waveform={message.waveform} />;

    case MessageKind.FILE:
      return (
        <FileMessage
          fileName={message.fileName}
          fileSize={message.fileSize}
          mimeType={message.mimeType}
        />
      );

    case MessageKind.LOCATION:
      return (
        <LocationMessage
          label={message.label}
          proximity={message.proximity}
          cover={message.cover}
        />
      );

    default:
      return null;
  }
}
