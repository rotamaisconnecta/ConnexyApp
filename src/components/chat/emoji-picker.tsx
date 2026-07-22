import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Search } from "lucide-react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES: Record<string, { label: string; emojis: string[] }> = {
  frequently: {
    label: "Frequentes",
    emojis: ["❤️", "😂", "😍", "🔥", "👍", "👏", "🙌", "💪", "🎉", "✨", "💯", "🥰"],
  },
  smileys: {
    label: "Sorrisos",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😙",
      "🥲",
      "😋",
      "😛",
      "😜",
      "🤪",
    ],
  },
  gestures: {
    label: "Gestos",
    emojis: [
      "👍",
      "👎",
      "👌",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "👇",
      "👋",
      "🤚",
      "✋",
      "🖐️",
      "🖖",
      "🫶",
      "👏",
      "🙌",
      "🤝",
      "🙏",
      "💪",
      "🦾",
    ],
  },
  hearts: {
    label: "Corações",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❤️‍🔥",
      "❤️‍🩹",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "♥️",
      "❣️",
      "💌",
      "🫀",
    ],
  },
  nature: {
    label: "Natureza",
    emojis: [
      "🌸",
      "🌺",
      "🌻",
      "🌹",
      "🌷",
      "🌼",
      "🍀",
      "🌿",
      "🍃",
      "🌴",
      "🌵",
      "🎋",
      "⭐",
      "🌙",
      "☀️",
      "🌈",
      "☁️",
      "⚡",
      "🔥",
      "❄️",
      "🌊",
      "🦋",
      "🐝",
      "🐾",
    ],
  },
  food: {
    label: "Comida",
    emojis: [
      "☕",
      "🍵",
      "🧋",
      "🍺",
      "🍷",
      "🥂",
      "🍹",
      "🍕",
      "🍔",
      "🍟",
      "🌮",
      "🍣",
      "🍰",
      "🎂",
      "🍩",
      "🍪",
      "🍫",
      "🍬",
      "🍭",
      "🧁",
      "🍓",
      "🥑",
      "🍿",
      "🥂",
    ],
  },
  activities: {
    label: "Atividades",
    emojis: [
      "⚽",
      "🏀",
      "🏈",
      "🎾",
      "🏐",
      "🎯",
      "🎮",
      "🎲",
      "🎵",
      "🎶",
      "🎸",
      "🎤",
      "🎬",
      "📸",
      "🎨",
      "📚",
      "✈️",
      "🚗",
      "🚀",
      "🏠",
      "🎪",
      "🎭",
      "🏆",
      "🎁",
    ],
  },
};

const categoryKeys = Object.keys(EMOJI_CATEGORIES);

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(categoryKeys[0]);
  const [search, setSearch] = useState("");

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) {
      return EMOJI_CATEGORIES[activeCategory]?.emojis ?? [];
    }
    const all = categoryKeys.flatMap((k) => EMOJI_CATEGORIES[k].emojis);
    return all;
  }, [activeCategory, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-2 mx-3 rounded-2xl border border-border bg-surface shadow-elegant overflow-hidden z-50"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar"
            className="w-full h-7 rounded-lg bg-muted pl-7 pr-2 text-xs focus:outline-none"
            aria-label="Pesquisar emojis"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-lg grid place-items-center hover:bg-accent"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex gap-0.5 px-2 py-1.5 border-b border-border overflow-x-auto no-scrollbar">
        {categoryKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategory(key)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors ${
              activeCategory === key
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {EMOJI_CATEGORIES[key].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[180px] overflow-y-auto no-scrollbar">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            onClick={() => onSelect(emoji)}
            className="h-8 w-8 rounded-lg grid place-items-center text-lg hover:bg-accent transition-colors"
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
