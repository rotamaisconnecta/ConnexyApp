import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Colors, Radius } from "@/theme";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  onClear?: () => void;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  loading = false,
  onClear,
  className,
}: SearchBarProps) {
  return (
    <div
      className={cn("relative flex items-center h-12 px-4", className)}
      style={{
        borderRadius: Radius.md,
        background: Colors.surface,
        border: `1px solid ${Colors.border}`,
      }}
    >
      <span className="flex-shrink-0 mr-3">
        <Search className="w-5 h-5" style={{ color: Colors.text.secondary }} />
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: Colors.text.primary }}
      />

      <AnimatePresence>
        {loading && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex-shrink-0 ml-2"
          >
            <svg
              className="w-5 h-5 animate-spin"
              style={{ color: Colors.brand.primary }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </motion.span>
        )}

        {!loading && value.length > 0 && onClear && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClear}
            className="flex-shrink-0 ml-2 p-1 rounded-full transition-colors"
            style={{ borderRadius: Radius.floating }}
          >
            <X className="w-4 h-4" style={{ color: Colors.text.secondary }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
