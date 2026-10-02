import { type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, QuickReaction } from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";
import { ReadStatus } from "./read-status";
import { ImageMessage } from "./image-message";
import { VideoMessage } from "./video-message";
import { AudioPlayer } from "./audio-player";
import { FileMessage } from "./file-message";
import { LocationMessage } from "./location-message";
import { EventMessage } from "./event-message";
import { QuickReactions } from "./quick-reactions";
import { formatMessageTime } from "@/lib/chat/chat-format";
import { getMessageAlignment } from "@/lib/chat/chat-utils";
import { getStatusColor } from "@/lib/chat/message-status";
import { LocalMediaFrame } from "@/components/media/local-media-frame";
import { isTimelineCard } from "@/lib/chat/timeline-context";
import { isChatMessageSelectable, SELECTION_LONG_PRESS_MS } from "@/lib/chat/chat-selection";
import { isOpenableChatDocument, isOpenableChatMedia, isChatMediaActionTarget } from "@/lib/chat/chat-message-actions";
import { shouldOpenMediaOnPointerEnd } from "@/lib/chat/message-long-press";
import { useMessageLongPress } from "./use-message-long-press";
import { OwnMediaHoverActions } from "./own-media-actions";

interface MessageBubbleProps {
  message: ChatMessage;
  participantPhoto: string;
  grouped: boolean;
  onReaction?: (messageId: string, reaction: QuickReaction) => void;
  onRetry?: (messageId: string) => void;
  onOpenSharedContent?: (contentId: string, kind: "event" | "place") => void;
  showSender?: boolean;
  selecting?: boolean;
  selected?: boolean;
  onToggleSelect?: (messageId: string) => void;
  onEnterSelection?: (messageId: string) => void;
  onRequestDelete?: (message: ChatMessage) => void;
  onDownload?: (message: ChatMessage) => void;
  onOpenMedia?: (message: ChatMessage) => void;
  onOpenDocument?: (message: ChatMessage) => void;
}

export function MessageBubble({
  message,
  grouped,
  onReaction,
  onOpenSharedContent,
  showSender = false,
  selecting = false,
  selected = false,
  onToggleSelect,
  onEnterSelection,
  onRequestDelete,
  onDownload,
  onOpenMedia,
  onOpenDocument,
}: MessageBubbleProps) {
  const alignment = getMessageAlignment(message);
  const isMe = alignment === "right";
  const selectable = isChatMessageSelectable(message.from);
  const card = isTimelineCard(message);
  const compactAudio = message.kind === MessageKind.AUDIO;
  const longPress = useMessageLongPress({
    enabled: selectable,
    delayMs: SELECTION_LONG_PRESS_MS,
    onLongPress: () => onEnterSelection?.(message.id),
  });

  return (
    <div
      id={`msg-${message.id}`}
      data-long-press-ms={SELECTION_LONG_PRESS_MS}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerCancel={longPress.onPointerCancel}
      onClickCapture={(event) => {
        if (longPress.consumeClickSuppression()) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (isChatMediaActionTarget(event.target)) {
          return;
        }
        if (selecting && selectable) {
          event.preventDefault();
          event.stopPropagation();
          onToggleSelect?.(message.id);
          return;
        }
        if (
          shouldOpenMediaOnPointerEnd({ selecting, longPressRecognized: false }) &&
          isOpenableChatMedia(message)
        ) {
          onOpenMedia?.(message);
          return;
        }
        if (
          shouldOpenMediaOnPointerEnd({ selecting, longPressRecognized: false }) &&
          isOpenableChatDocument(message)
        ) {
          event.preventDefault();
          event.stopPropagation();
          onOpenDocument?.(message);
        }
      }}
      onContextMenu={(event) => {
        if (selectable) event.preventDefault();
      }}
      className={cn(
        "group flex min-w-0 select-none [-webkit-touch-callout:none] [-webkit-user-select:none]",
        isMe ? "justify-end" : "justify-start",
        grouped ? "mt-1" : "mt-2.5",
      )}
    >
      {selecting ? (
        <span
          className={cn(
            "mr-2 mt-3 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
            selected
              ? "border-primary bg-primary text-white"
              : selectable
                ? "border-primary/30 bg-white"
                : "border-transparent bg-transparent opacity-0",
          )}
          aria-hidden
        >
          {selected ? <Check className="h-3 w-3" /> : null}
        </span>
      ) : null}
      <div
        className={cn(
          "min-w-0",
          card ? "w-[min(100%,280px)]" : "max-w-[78%]",
          isMe && "items-end",
          selected && "rounded-[26px] bg-primary/[0.07] p-1 ring-1 ring-primary/15",
        )}
      >
        {showSender && (
          <p
            className={cn(
              "mb-1 px-1 text-[10px] font-semibold text-muted-foreground",
              isMe && "text-right",
            )}
          >
            {message.senderName ?? (isMe ? "Você" : "Participante")}
          </p>
        )}
        <div
          className={cn(
            "relative text-sm",
            card
              ? "overflow-hidden"
              : compactAudio
                ? cn(
                    "rounded-[22px] px-3 py-2.5 shadow-[0_8px_20px_rgba(108,59,255,0.10)]",
                    isMe
                      ? "bg-gradient-brand text-primary-foreground"
                      : "bg-[#F4EEFF] text-foreground shadow-[0_6px_18px_rgba(24,24,43,0.04)]",
                  )
                : cn(
                    "rounded-[22px] px-3.5 py-2.5 leading-relaxed",
                    isMe
                      ? "bg-gradient-brand text-white shadow-[0_10px_24px_rgba(108,59,255,0.16)]"
                      : "bg-[#F4EEFF] text-foreground shadow-[0_8px_22px_rgba(24,24,43,0.04)]",
                  ),
          )}
        >
          {renderContent(message, {
            selecting,
            onOpenSharedContent,
            onRequestDelete,
            onDownload,
            onOpenMedia,
            onOpenDocument,
          })}

          {message.reaction && (
            <span className="absolute -bottom-2 right-2 rounded-full bg-white px-1.5 py-0.5 text-sm shadow-[0_4px_12px_rgba(24,24,43,0.08)]">
              {message.reaction}
            </span>
          )}
        </div>

        <div
          className={cn(
            "mt-1 flex items-center gap-1.5 px-1",
            isMe ? "justify-end" : "justify-start",
          )}
        >
          <span className={cn("text-[10px] tabular-nums text-muted-foreground/80", getStatusColor(message.status))}>
            {formatMessageTime(message.at)}
          </span>
          {isMe && <ReadStatus status={message.status} />}
        </div>

        {onReaction && !selecting && (
          <div className="max-h-0 overflow-hidden opacity-0 transition-all group-hover:max-h-10 group-hover:opacity-100 group-focus-within:max-h-10 group-focus-within:opacity-100">
            <QuickReactions
              messageId={message.id}
              currentReaction={message.reaction}
              onSelect={onReaction}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function renderContent(
  message: ChatMessage,
  options: {
    selecting: boolean;
    onOpenSharedContent?: (contentId: string, kind: "event" | "place") => void;
    onRequestDelete?: (message: ChatMessage) => void;
    onDownload?: (message: ChatMessage) => void;
    onOpenMedia?: (message: ChatMessage) => void;
    onOpenDocument?: (message: ChatMessage) => void;
  },
): ReactNode {
  switch (message.kind) {
    case MessageKind.TEXT:
      return <p className="whitespace-pre-wrap break-words leading-[1.45]">{message.text}</p>;

    case MessageKind.IMAGE:
      return wrapOwnMediaActions(
        message,
        options,
        <LocalMediaFrame mediaId={message.mediaId} fallbackUrl={message.url}>
          {(url) => (
            <ImageMessage
              url={url ?? ""}
              caption={message.caption}
              width={message.width}
              height={message.height}
              mediaId={message.mediaId}
              selecting={options.selecting}
              onOpenMedia={() => options.onOpenMedia?.(message)}
            />
          )}
        </LocalMediaFrame>,
      );

    case MessageKind.VIDEO:
      return wrapOwnMediaActions(
        message,
        options,
        <LocalMediaFrame mediaId={message.mediaId} fallbackUrl={message.url}>
          {(url) => (
            <VideoMessage
              url={url ?? ""}
              thumbnail={message.thumbnail}
              durationSec={message.durationSec}
              selecting={options.selecting}
              onOpenMedia={() => options.onOpenMedia?.(message)}
            />
          )}
        </LocalMediaFrame>,
      );

    case MessageKind.AUDIO:
      return (
        <AudioPlayer
          durationSec={message.durationSec}
          waveform={message.waveform}
          mediaId={message.mediaId}
          src={message.url}
          isMine={message.from === "me"}
        />
      );

    case MessageKind.FILE:
      return wrapOwnMediaActions(
        message,
        options,
        <FileMessage
          fileName={message.fileName}
          fileSize={message.fileSize}
          mimeType={message.mimeType}
          selecting={options.selecting}
          onOpen={options.onOpenDocument ? () => options.onOpenDocument?.(message) : undefined}
        />,
      );

    case MessageKind.LOCATION:
      return (
        <LocationMessage
          label={message.label}
          proximity={message.proximity}
          cover={message.cover}
          lat={message.lat}
          lng={message.lng}
          onView={
            message.contentId && options.onOpenSharedContent
              ? () => options.onOpenSharedContent?.(message.contentId!, message.contentType ?? "place")
              : undefined
          }
        />
      );

    case MessageKind.EVENT:
      return (
        <EventMessage
          title={message.title}
          cover={message.cover}
          dateText={message.dateText}
          location={message.location}
          onView={() => {
            if (message.contentId && options.onOpenSharedContent) {
              options.onOpenSharedContent(message.contentId, message.contentType ?? "event");
            }
          }}
        />
      );

    default:
      return null;
  }
}

function wrapOwnMediaActions(
  message: ChatMessage,
  options: {
    selecting: boolean;
    onRequestDelete?: (message: ChatMessage) => void;
    onDownload?: (message: ChatMessage) => void;
  },
  content: ReactNode,
): ReactNode {
  if (message.from !== "me" || options.selecting) return content;
  if (!options.onDownload || !options.onRequestDelete) return content;
  return (
    <div className="group/media relative overflow-hidden rounded-[22px]">
      {content}
      <OwnMediaHoverActions
        onDownload={() => options.onDownload?.(message)}
        onDelete={() => options.onRequestDelete?.(message)}
      />
    </div>
  );
}
