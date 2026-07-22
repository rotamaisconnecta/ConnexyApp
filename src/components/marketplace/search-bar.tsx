import { useState, useRef, useEffect } from "react";
import { Search, X, Mic } from "lucide-react";
import { getSearchSuggestions } from "@/lib/marketplace/business-filter";
import type { Business } from "@/lib/marketplace/business-types";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  businesses?: Business[];
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  businesses = [],
  placeholder = "Buscar empresas, eventos...",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = getSearchSuggestions(businesses, value);

  const showSuggestions = isFocused && suggestions.length > 0 && value.trim().length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleClear() {
    onChange("");
    onSubmit?.("");
    inputRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.(value);
    setIsFocused(false);
  }

  function handleSuggestionClick(suggestion: string) {
    onChange(suggestion);
    onSubmit?.(suggestion);
    setIsFocused(false);
  }

  return (
    <div className="relative" ref={inputRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-20 rounded-full bg-secondary border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar busca"
              className="h-7 w-7 grid place-items-center rounded-full hover:bg-border/50 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            aria-label="Busca por voz"
            className="h-7 w-7 grid place-items-center rounded-full hover:bg-border/50 transition-colors"
          >
            <Mic className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </form>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border/50 rounded-2xl shadow-elevated overflow-hidden z-50">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
