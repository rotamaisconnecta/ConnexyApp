import { useState, useRef, useCallback } from "react";
import { Send, Smile, Paperclip, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "./emoji-picker";
import { AttachmentSheet } from "./attachment-sheet";
import { VoiceRecorder } from "./voice-recorder";

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendVoice?: (durationSec: number) => void;
  onOpenAttachment?: (kind: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendText,
  onSendVoice,
  onOpenAttachment,
  disabled = false,
  placeholder = "Escreva uma mensagem…",
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setText("");
    setShowEmoji(false);
    inputRef.current?.focus();
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
    (durationSec: number) => {
      setRecording(false);
      onSendVoice?.(durationSec);
    },
    [onSendVoice],
  );

  if (recording) {
    return <VoiceRecorder onCancel={() => setRecording(false)} onComplete={handleVoiceComplete} />;
  }

  const hasText = text.trim().length > 0;

  return (
    <div className="relative border-t border-border bg-surface/80 backdrop-blur-md px-3 py-2">
      {showEmoji && (
        <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => {
            setShowEmoji(!showEmoji);
            setShowAttach(false);
          }}
          className={cn(
            "h-9 w-9 rounded-xl grid place-items-center shrink-0 transition-colors",
            showEmoji ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent",
          )}
          aria-label="Emojis"
        >
          <Smile className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowAttach(!showAttach);
            setShowEmoji(false);
          }}
          className="h-9 w-9 rounded-xl grid place-items-center shrink-0 text-muted-foreground hover:bg-accent transition-colors"
          aria-label="Anexar"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {showAttach && onOpenAttachment && (
          <AttachmentSheet
            onSelect={(kind) => {
              onOpenAttachment(kind);
              setShowAttach(false);
            }}
            onClose={() => setShowAttach(false)}
          />
        )}

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring max-h-24 min-h-[36px]"
          aria-label="Mensagem"
        />

        {hasText ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled}
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 hover:brightness-110 active:scale-[0.97] transition-all"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        ) : onSendVoice ? (
          <button
            type="button"
            onClick={() => setRecording(true)}
            disabled={disabled}
            className="h-9 w-9 rounded-xl bg-secondary text-muted-foreground grid place-items-center shrink-0 hover:bg-accent transition-colors"
            aria-label="Gravar áudio"
          >
            <Mic className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
