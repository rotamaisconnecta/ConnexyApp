import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, Mic, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachmentAction } from "@/lib/chat/chat-types";
import {
  composerMaxHeightPx,
  mergeComposerSuggestion,
} from "@/lib/chat/composer-suggestion";
import { EmojiPicker } from "./emoji-picker";
import { AttachmentSheet } from "./attachment-sheet";
import { CameraChoiceSheet } from "./camera-choice-sheet";
import { VoiceRecorder, type VoiceClip } from "./voice-recorder";

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendVoice?: (clip: VoiceClip) => void | Promise<void>;
  onOpenAttachment?: (kind: AttachmentAction) => void;
  onCapturePhoto?: () => void;
  onRecordVideo?: () => void;
  disabled?: boolean;
  placeholder?: string;
  forceRecording?: number;
  insertRequest?: { token: number; text: string } | null;
  onInsertRequestHandled?: () => void;
}

export function MessageInput({
  onSendText,
  onSendVoice,
  onOpenAttachment,
  onCapturePhoto,
  onRecordVideo,
  disabled = false,
  placeholder = "Digite uma mensagem...",
  forceRecording = 0,
  insertRequest = null,
  onInsertRequestHandled,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const handledInsertToken = useRef<number | null>(null);
  const maxHeight = composerMaxHeightPx();

  const resizeComposer = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [maxHeight]);

  useEffect(() => {
    if (forceRecording > 0) setRecording(true);
  }, [forceRecording]);

  useEffect(() => {
    resizeComposer();
  }, [text, resizeComposer]);

  useEffect(() => {
    if (!insertRequest || handledInsertToken.current === insertRequest.token) return;
    handledInsertToken.current = insertRequest.token;
    setText((current) => mergeComposerSuggestion(current, insertRequest.text));
    onInsertRequestHandled?.();
    window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
      resizeComposer();
    });
  }, [insertRequest, onInsertRequestHandled, resizeComposer]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return;
    sendingRef.current = true;
    onSendText(trimmed);
    setText("");
    setShowEmoji(false);
    inputRef.current?.focus();
    window.setTimeout(() => {
      sendingRef.current = false;
    }, 400);
  }, [text, onSendText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const handleVoiceComplete = useCallback(
    async (clip: VoiceClip) => {
      await onSendVoice?.(clip);
      setRecording(false);
    },
    [onSendVoice],
  );

  if (recording) {
    return (
      <div className="px-3 pb-3 pt-1">
        <VoiceRecorder onCancel={() => setRecording(false)} onComplete={handleVoiceComplete} />
      </div>
    );
  }

  const hasText = text.trim().length > 0;
  const cameraEnabled = Boolean(onCapturePhoto || onRecordVideo);

  return (
    <div className="relative px-3 pb-3 pt-1">
      {showEmoji && (
        <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
      )}

      {onOpenAttachment ? (
        <AttachmentSheet
          open={showAttach}
          onSelect={(kind) => {
            onOpenAttachment(kind);
            setShowAttach(false);
          }}
          onClose={() => setShowAttach(false)}
        />
      ) : null}

      {showCamera && cameraEnabled ? (
        <CameraChoiceSheet
          onCapturePhoto={() => {
            setShowCamera(false);
            onCapturePhoto?.();
          }}
          onRecordVideo={() => {
            setShowCamera(false);
            onRecordVideo?.();
          }}
          onClose={() => setShowCamera(false)}
        />
      ) : null}

      <div className="flex items-end gap-0.5 rounded-[28px] border border-black/[0.04] bg-white px-1 py-1 shadow-[0_10px_30px_rgba(24,24,43,0.06)]">
        <button
          type="button"
          onClick={() => {
            setShowEmoji(!showEmoji);
            setShowAttach(false);
            setShowCamera(false);
          }}
          className={cn(
            "mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
            showEmoji ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary",
          )}
          aria-label="Emojis"
        >
          <Smile className="h-[18px] w-[18px]" />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowAttach(!showAttach);
            setShowEmoji(false);
            setShowCamera(false);
          }}
          className={cn(
            "mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
            showAttach ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary",
          )}
          aria-label="Anexar"
          aria-haspopup="dialog"
          aria-expanded={showAttach}
        >
          <Paperclip className="h-[18px] w-[18px]" />
        </button>

        {cameraEnabled ? (
          <button
            type="button"
            onClick={() => {
              setShowCamera((open) => !open);
              setShowAttach(false);
              setShowEmoji(false);
            }}
            className={cn(
              "mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
              showCamera ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary",
            )}
            aria-label="Câmera"
          >
            <Camera className="h-[18px] w-[18px]" />
          </button>
        ) : null}

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{ maxHeight, lineHeight: "22px" }}
          className="min-h-[36px] min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-[22px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          aria-label="Mensagem"
        />

        {hasText ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled}
            className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-white transition-transform hover:brightness-110 active:scale-[0.96]"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        ) : onSendVoice ? (
          <button
            type="button"
            onClick={() => setRecording(true)}
            disabled={disabled}
            className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Gravar áudio"
          >
            <Mic className="h-[18px] w-[18px]" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
