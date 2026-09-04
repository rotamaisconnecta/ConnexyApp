import { useRef } from "react";
import { ChevronLeft, ChevronRight, Coffee, MapPin, Star, UsersRound } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { commonGround, compatibilityScore, people, type Person } from "@/lib/mock-data";
import { formatPersonDistance } from "@/lib/proximity";

const FEATURED_IDS = [
  "luana",
  "pedro-henrique",
  "marina",
  "beatriz",
  "juliana",
  "ana-clara",
  "joao-pedro",
];

function featuredPeople(): Person[] {
  const selected = FEATURED_IDS.map((id) => people.find((person) => person.id === id)).filter(
    (person): person is Person => Boolean(person),
  );
  return selected.length === FEATURED_IDS.length ? selected : people.slice(0, 7);
}

function MapArtwork() {
  return (
    <svg
      viewBox="0 0 600 320"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <rect width="600" height="320" fill="#f3f1ec" />
      <path d="M535 -20C515 66 541 116 512 170C484 220 504 275 463 340H630V-20Z" fill="#c8d7d8" />
      <path
        d="M522 -20C506 63 528 113 500 166C476 212 494 267 452 340"
        fill="none"
        stroke="#aec4c5"
        strokeWidth="4"
      />
      <g fill="#e3e8dc" opacity="0.82">
        <path d="M30 24h82v42H30zM126 18h58v66h-58zM205 34h95v42h-95zM326 18h92v58h-92z" />
        <path d="M19 96h71v54H19zM110 102h104v41H110zM233 93h68v66h-68zM326 98h96v49h-96z" />
        <path d="M42 175h92v53H42zM154 164h62v70h-62zM244 180h93v51h-93zM360 167h70v68h-70z" />
        <path d="M16 252h106v49H16zM146 251h89v52h-89zM259 250h64v51h-64zM346 253h91v48h-91z" />
      </g>
      <g fill="none" stroke="#ffffff" strokeLinecap="round">
        <path d="M-20 72C112 52 190 94 310 73C401 57 462 22 530 19" strokeWidth="9" />
        <path d="M-10 157C97 132 181 181 288 157C372 138 427 102 516 111" strokeWidth="8" />
        <path d="M6 245C125 219 194 267 309 241C387 224 436 199 492 198" strokeWidth="9" />
        <path d="M87 -12C101 70 79 126 97 208C106 250 129 286 134 337" strokeWidth="8" />
        <path d="M214 -15C221 66 202 117 219 189C232 242 264 280 268 337" strokeWidth="9" />
        <path d="M361 -12C350 60 371 115 356 183C345 237 328 276 334 336" strokeWidth="8" />
        <path d="M459 -12C438 51 463 105 445 158C427 211 449 267 422 337" strokeWidth="7" />
      </g>
      <g fill="none" stroke="#d7d2c9" strokeWidth="2" opacity="0.9">
        <path d="M-10 38L509 283M17 302L474 41M8 116L464 300M42 6L483 221" />
        <path d="M154 -12L118 330M298 -9L289 331M410 -10L386 332" />
        <path d="M-10 201C129 183 221 218 327 199C403 186 449 149 510 158" />
      </g>
    </svg>
  );
}

function AvatarMarker({ person, className }: { person: Person; className: string }) {
  return (
    <Link
      to="/perfil/$id"
      params={{ id: person.id }}
      aria-label={`Ver perfil de ${person.name}`}
      className={`absolute z-20 rounded-full transition-transform active:scale-95 ${className}`}
    >
      <img
        src={person.photo}
        alt=""
        className="h-12 w-12 rounded-full border-[3px] border-white object-cover shadow-lg"
      />
      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2px] border-white bg-primary" />
    </Link>
  );
}

function PersonCard({ person }: { person: Person }) {
  const compatibility = compatibilityScore(person);
  const common = commonGround(person);
  const commonLabels = [...common.sharedInterests, ...common.sharedVibe];
  const commonCount = commonLabels.length;

  return (
    <Link
      to="/perfil/$id"
      params={{ id: person.id }}
      className="group w-[156px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-border/60 bg-surface shadow-soft transition-transform active:scale-[0.98]"
      aria-label={`Ver perfil de ${person.name}`}
    >
      <div className="relative h-[116px] overflow-hidden bg-muted">
        <img
          src={person.photo}
          alt={person.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <span className="absolute right-2 top-2 rounded-full bg-white/92 px-2 py-1 text-[9px] font-bold text-primary shadow-soft backdrop-blur">
          {compatibility}% compatível
        </span>
        <p className="absolute bottom-2 left-2 rounded-full bg-black/35 px-2 py-1 text-[9px] font-medium text-white backdrop-blur">
          {formatPersonDistance(person.distanceMeters)}
        </p>
      </div>
      <div className="p-2.5">
        <div className="truncate font-display text-[15px] font-bold leading-tight">
          {person.name.split(" ")[0]}, {person.age}
        </div>
        <div className="mt-2 flex min-h-5 gap-1 overflow-hidden">
          {person.interests.slice(0, 2).map((interest) => (
            <span
              key={interest}
              className="shrink-0 rounded-full bg-secondary px-2 py-1 text-[8px] font-semibold text-foreground"
            >
              {interest}
            </span>
          ))}
        </div>
        <p className="mt-2 line-clamp-2 min-h-7 text-[9px] font-medium leading-[1.35] text-primary">
          {commonCount > 0
            ? `${commonCount} em comum · ${commonLabels.slice(0, 2).join(" · ")}`
            : `Qualidade: ${person.vibeTags?.[0] ?? "boa companhia"}`}
        </p>
      </div>
    </Link>
  );
}

export function ConnexyPulse() {
  const featured = featuredPeople();
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollPeople = (direction: -1 | 1) => {
    carouselRef.current?.scrollBy({ left: direction * 336, behavior: "smooth" });
  };

  return (
    <section className="mt-6 overflow-hidden border-y border-border/30 bg-surface/40">
      <div className="relative h-[270px] overflow-hidden">
        <MapArtwork />
        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/5 to-white/35" />

        <div className="absolute left-5 top-5 z-20 max-w-[185px]">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.025em] text-gray-950">
            Connexy Pulse
          </h2>
          <p className="mt-1 text-[17px] leading-tight text-gray-800">
            A cidade combina com você agora.
          </p>
        </div>

        {featured[0] && <AvatarMarker person={featured[0]} className="left-[45%] top-5" />}
        {featured[1] && <AvatarMarker person={featured[1]} className="right-[11%] top-[88px]" />}
        {featured[2] && <AvatarMarker person={featured[2]} className="left-[17%] top-[142px]" />}

        <div className="absolute left-[53%] top-[132px] z-10 grid h-11 w-11 place-items-center rounded-full bg-primary/20">
          <span className="absolute h-11 w-11 rounded-full bg-primary/25 motion-safe:animate-ping" />
          <span className="relative grid h-5 w-5 place-items-center rounded-full bg-primary shadow-[0_0_0_5px_rgba(255,255,255,0.75)]">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        </div>

        <span className="absolute right-[17%] top-11 z-10 grid h-8 w-8 place-items-center rounded-full bg-primary text-white shadow-lg">
          <Coffee className="h-4 w-4" />
        </span>
        <span className="absolute bottom-[62px] left-[57%] z-10 grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-white shadow-lg">
          <Star className="h-4 w-4 fill-current" />
        </span>

        <Link
          to="/discover"
          search={{ filter: "people" }}
          className="absolute bottom-4 left-1/2 z-30 inline-flex h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-gradient-brand px-5 text-xs font-semibold text-white shadow-floating transition-transform active:scale-[0.98]"
        >
          <UsersRound className="h-4 w-4" /> Ver pessoas perto de mim
        </Link>
      </div>

      <div className="bg-background px-5 pb-5 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold">Perto de você</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Pessoas disponíveis ao seu redor
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollPeople(-1)}
              aria-label="Ver pessoas anteriores"
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary/70 text-foreground transition active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollPeople(1)}
              aria-label="Ver mais pessoas"
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary/70 text-foreground transition active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar"
        >
          {featured.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" />
          Distâncias curtas são protegidas por privacidade.
        </div>
      </div>
    </section>
  );
}
