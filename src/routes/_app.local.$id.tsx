import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { places } from "@/lib/mock-data";
import { ChevronLeft, Star, Phone, Navigation, Bookmark, Share2 } from "lucide-react";

export const Route = createFileRoute("/_app/local/$id")({
  head: ({ loaderData }: { loaderData?: { name: string; cover: string } }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — RotaMais Connecta` : "Local — RotaMais Connecta" },
      ...(loaderData ? [{ property: "og:title", content: loaderData.name }, { property: "og:image", content: loaderData.cover }] : []),
    ],
  }),
  loader: ({ params }) => {
    const p = places.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return p;
  },
  errorComponent: ({ error }) => <div className="p-6 text-sm">{error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Local não encontrado.</div>,
  component: LocalDetail,
});

function LocalDetail() {
  const p = Route.useLoaderData();
  return (
    <div className="flex-1">
      <div className="relative">
        <img src={p.cover} alt={p.name} className="h-56 w-full object-cover" />
        <div className="absolute inset-x-0 top-0">
          <StatusBar dark />
        </div>
        <Link to="/locais" className="absolute top-14 left-4 h-10 w-10 grid place-items-center rounded-full bg-white/90 backdrop-blur">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="absolute top-14 right-4 flex gap-2">
          <button className="h-10 w-10 grid place-items-center rounded-full bg-white/90"><Bookmark className="h-4 w-4" /></button>
          <button className="h-10 w-10 grid place-items-center rounded-full bg-white/90"><Share2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="text-[11px] uppercase text-primary font-semibold">{p.category}</div>
        <h1 className="font-display text-2xl font-bold">{p.name}</h1>
        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
          <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating} ({p.reviews} avaliações)</span>
          <span>·</span><span>{p.distance}</span><span>·</span><span>{p.hours}</span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.description}</p>

        {p.promo && (
          <div className="mt-4 rounded-2xl bg-gradient-brand p-4 text-white shadow-elegant">
            <div className="text-[11px] uppercase opacity-90">Promoção</div>
            <div className="font-display text-lg font-bold">{p.promo}</div>
            <button className="mt-2 rounded-full bg-white text-primary text-xs font-semibold px-3 py-1.5">
              Usar promoção
            </button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { Icon: Phone, label: "Ligar" },
            { Icon: Navigation, label: "Rota" },
            { Icon: Bookmark, label: "Salvar" },
            { Icon: Share2, label: "Compartilhar" },
          ].map(({ Icon, label }) => (
            <button key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-3 text-[11px] font-semibold">
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="font-display font-bold text-sm mb-2">Avaliações recentes</h2>
          <div className="space-y-2">
            {[
              { n: "Ana R.", t: "Ambiente ótimo, café espetacular." },
              { n: "Pedro L.", t: "Atendimento rápido e simpático." },
            ].map((r) => (
              <div key={r.n} className="rounded-2xl border border-border p-3">
                <div className="flex items-center gap-1 text-[11px] font-semibold">{r.n} · <span className="text-amber-500">★★★★★</span></div>
                <p className="text-xs text-muted-foreground mt-1">{r.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5">
        <Link to="/rota" className="block w-full rounded-full bg-gradient-brand py-4 text-center text-white font-semibold shadow-elegant">
          Ir até lá
        </Link>
      </div>
    </div>
  );
}
