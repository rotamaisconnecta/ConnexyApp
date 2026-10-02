export type CreateArtId =
  | "photo"
  | "event"
  | "place"
  | "business"
  | "marketplace"
  | "reel"
  | "moment"
  | "browse"
  | "profile"
  | "ride"
  | "hail";

export function CreateCardArt({ id }: { id: CreateArtId }) {
  switch (id) {
    case "photo":
      return (
        <svg viewBox="0 0 220 160" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="220" height="160" rx="28" fill="#1F3A5F" />
          <circle cx="168" cy="48" r="22" fill="#F4C95D" />
          <rect x="28" y="54" width="118" height="78" rx="16" fill="#EEF4FF" />
          <circle cx="87" cy="93" r="24" fill="#2F6FED" />
          <circle cx="87" cy="93" r="12" fill="#0B1B33" />
          <rect x="40" y="64" width="22" height="10" rx="5" fill="#C9D7F2" />
        </svg>
      );
    case "event":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#3B1D4A" />
          <rect x="22" y="28" width="86" height="84" rx="14" fill="#F7E9FF" />
          <rect x="34" y="42" width="62" height="8" rx="4" fill="#C084FC" />
          <circle cx="48" cy="72" r="8" fill="#FB7185" />
          <circle cx="72" cy="72" r="8" fill="#F59E0B" />
          <circle cx="60" cy="92" r="8" fill="#38BDF8" />
          <path d="M126 86c18-22 38-10 38 10 0 18-20 28-38 18-10 16-28 8-28-8 0-18 16-22 28-20z" fill="#F9A8D4" />
        </svg>
      );
    case "place":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#123524" />
          <path d="M28 108h124L118 44H62z" fill="#86EFAC" />
          <rect x="72" y="62" width="36" height="46" rx="6" fill="#14532D" />
          <circle cx="132" cy="40" r="16" fill="#FDE68A" />
          <path d="M90 28c0-12 18-18 18 0 0 14-18 28-18 28S72 42 72 28c0-18 18-12 18 0z" fill="#EF4444" />
        </svg>
      );
    case "business":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#1E293B" />
          <rect x="24" y="48" width="52" height="72" rx="8" fill="#93C5FD" />
          <rect x="84" y="28" width="72" height="92" rx="8" fill="#BFDBFE" />
          <rect x="36" y="62" width="12" height="12" rx="2" fill="#1D4ED8" />
          <rect x="52" y="62" width="12" height="12" rx="2" fill="#1D4ED8" />
          <rect x="98" y="44" width="14" height="14" rx="2" fill="#1E3A8A" />
          <rect x="120" y="44" width="14" height="14" rx="2" fill="#1E3A8A" />
          <rect x="108" y="92" width="24" height="28" rx="4" fill="#0F172A" />
        </svg>
      );
    case "marketplace":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#3F1D0F" />
          <rect x="28" y="36" width="70" height="78" rx="14" fill="#FED7AA" />
          <rect x="42" y="50" width="42" height="28" rx="6" fill="#FDBA74" />
          <circle cx="128" cy="78" r="32" fill="#F59E0B" />
          <path d="M116 78h24M128 66v24" stroke="#7C2D12" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    case "reel":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#111827" />
          <rect x="58" y="16" width="64" height="108" rx="16" fill="#6D28D9" />
          <rect x="66" y="28" width="48" height="72" rx="8" fill="#111827" />
          <polygon points="82,48 108,64 82,80" fill="#F9FAFB" />
          <circle cx="140" cy="36" r="10" fill="#F43F5E" />
        </svg>
      );
    case "moment":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#4C1D3D" />
          <circle cx="142" cy="38" r="20" fill="#FBBF24" />
          <rect x="26" y="36" width="88" height="80" rx="14" fill="#FDE68A" />
          <rect x="38" y="48" width="64" height="40" rx="8" fill="#F9A8D4" />
          <circle cx="70" cy="68" r="10" fill="#FDF2F8" />
          <rect x="44" y="96" width="52" height="8" rx="4" fill="#DB2777" />
        </svg>
      );
    case "browse":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#1C1917" />
          <rect x="22" y="52" width="44" height="68" rx="8" fill="#FDBA74" />
          <rect x="74" y="36" width="44" height="84" rx="8" fill="#F59E0B" />
          <rect x="126" y="58" width="34" height="62" rx="8" fill="#FDE68A" />
          <path d="M36 52v-10h16v10" fill="#FB923C" />
          <path d="M88 36v-12h16v12" fill="#D97706" />
          <circle cx="96" cy="86" r="8" fill="#7C2D12" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#312E81" />
          <circle cx="90" cy="54" r="22" fill="#C7D2FE" />
          <path d="M48 116c6-28 24-40 42-40s36 12 42 40" fill="#A5B4FC" />
          <circle cx="138" cy="40" r="10" fill="#FDE68A" />
        </svg>
      );
    case "ride":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#0F172A" />
          <path d="M18 104h144" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
          <path d="M40 90h28l18-22h42l18 22h10v18H40z" fill="#93C5FD" />
          <rect x="78" y="72" width="28" height="14" rx="4" fill="#DBEAFE" />
          <circle cx="62" cy="110" r="10" fill="#1E293B" />
          <circle cx="62" cy="110" r="5" fill="#94A3B8" />
          <circle cx="128" cy="110" r="10" fill="#1E293B" />
          <circle cx="128" cy="110" r="5" fill="#94A3B8" />
        </svg>
      );
    case "hail":
      return (
        <svg viewBox="0 0 180 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
          <rect width="180" height="140" rx="24" fill="#2E1065" />
          <path
            d="M36 108 C58 88, 78 96, 98 72 S140 44, 154 38"
            fill="none"
            stroke="#C4B5FD"
            strokeWidth="4"
            strokeDasharray="6 7"
            strokeLinecap="round"
          />
          <path d="M28 44c0-10 14-16 14 0 0 12-14 24-14 24S14 56 14 44c0-16 14-10 14 0z" fill="#34D399" />
          <circle cx="28" cy="42" r="5" fill="#ECFDF5" />
          <path d="M154 22c0-10 14-16 14 0 0 12-14 24-14 24s-14-12-14-24c0-16 14-10 14 0z" fill="#FB7185" />
          <circle cx="154" cy="20" r="5" fill="#FFF1F2" />
          <path d="M48 102h22l12-16h36l14 16h10v14H48z" fill="#EDE9FE" />
          <rect x="86" y="90" width="26" height="10" rx="3" fill="#A78BFA" />
          <path d="M40 96h10M36 102h8" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
          <circle cx="70" cy="118" r="8" fill="#1E1B4B" />
          <circle cx="70" cy="118" r="3.5" fill="#C4B5FD" />
          <circle cx="128" cy="118" r="8" fill="#1E1B4B" />
          <circle cx="128" cy="118" r="3.5" fill="#C4B5FD" />
        </svg>
      );
  }
}
