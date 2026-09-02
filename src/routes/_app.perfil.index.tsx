import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { ArrowLeft, BriefcaseBusiness, Camera, Check, ChevronRight, Heart, Home, Lock, MapPin, PenLine, Plus, Settings, Share2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBar } from "@/components/phone-frame";
import { currentUser, findPlace, people } from "@/lib/mock-data";
import { saveDemoOwnProfile, useDemoOwnProfile, type DemoOwnProfile } from "@/lib/demo/demo-own-profile";

export const Route = createFileRoute("/_app/perfil/")({
  head: () => ({ meta: [{ title: "Meu perfil — Connexy" }] }),
  component: OwnProfile,
});

const options = ["Fotografia", "Música", "Cafés", "Corrida", "Viagens", "Tecnologia"];
const cover = "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200";
type UpdateProfile = <K extends keyof DemoOwnProfile>(key: K, value: DemoOwnProfile[K]) => void;

function OwnProfile() {
  const profile = useDemoOwnProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  useEffect(() => { if (!editing) setDraft(profile); }, [editing, profile]);

  const update: UpdateProfile = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  const toggle = (value: string) => update("interests", draft.interests.includes(value) ? draft.interests.filter((item) => item !== value) : [...draft.interests, value]);
  const save = () => {
    const name = draft.name.trim();
    const handle = draft.handle.trim().replace(/^@/, "");
    if (!name || !handle) return toast.error("Preencha seu nome e nome de usuário.");
    saveDemoOwnProfile({ ...draft, name, handle });
    setEditing(false);
    toast.success("Alterações salvas neste dispositivo.");
  };

  return editing ? <Editor draft={draft} update={update} toggle={toggle} save={save} cancel={() => setEditing(false)} /> : <Profile profile={profile} edit={() => setEditing(true)} />;
}

function Profile({ profile, edit }: { profile: DemoOwnProfile; edit: () => void }) {
  const places = (currentUser.favoritePlaceIds ?? []).map(findPlace).filter(Boolean).slice(0, 3);
  return <main className="min-h-full bg-background pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]">
    <StatusBar />
    <header className="flex items-center justify-between px-5 pb-3 pt-1">
      <Link to="/home" aria-label="Voltar para a Home" className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></Link>
      <h1 className="font-display text-lg font-bold">Meu perfil</h1>
      <div className="flex"><button type="button" aria-label="Compartilhar perfil" className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><Share2 className="h-4 w-4" /></button><button type="button" aria-label="Editar perfil" onClick={edit} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><Settings className="h-5 w-5" /></button></div>
    </header>
    <section className="px-4"><div className="overflow-hidden rounded-[30px] border border-border bg-surface shadow-soft"><img src={cover} alt="" className="h-32 w-full object-cover" /><div className="relative -mt-12 px-5 pb-5 text-center"><img src={profile.photo} alt={profile.name} className="mx-auto h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg" /><h2 className="mt-3 font-display text-2xl font-bold">{profile.name}</h2><p className="text-sm text-muted-foreground">@{profile.handle}</p><p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" />{profile.city}</p><p className="mx-auto mt-3 max-w-[290px] text-sm leading-relaxed text-muted-foreground">{profile.bio}</p></div></div></section>
    <section className="mx-4 mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => toast.success("Editor de publicação será aberto aqui.")} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-sm font-semibold text-white shadow-soft"><Plus className="h-4 w-4" />Nova publicação</button><button type="button" onClick={edit} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/[0.06] text-sm font-semibold text-primary"><PenLine className="h-4 w-4" />Editar perfil</button></section>
    <section className="mx-4 mt-3 grid grid-cols-3 rounded-2xl border border-border bg-surface py-3 text-center shadow-soft"><Stat value="128" label="Conexões" /><Stat value="24" label="Publicações" divider /><Stat value="35" label="Lugares" /></section>
    <div className="mt-3 flex gap-2 overflow-x-auto px-4 no-scrollbar">{profile.interests.map((item) => <span key={item} className="shrink-0 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-semibold text-primary">{item}</span>)}</div>
    <Section title="Amigos em comum" action="12 amigos em comum"><div className="flex gap-3 overflow-x-auto no-scrollbar">{people.slice(0, 5).map((person) => <div key={person.id} className="w-12 shrink-0 text-center"><img src={person.photo} alt="" className="h-11 w-11 rounded-full object-cover" /><span className="mt-1 block truncate text-[10px] text-muted-foreground">{person.name}</span></div>)}</div></Section>
    <Section title="Lugares que curtiu"><div className="flex gap-3 overflow-x-auto no-scrollbar">{places.map((place) => place && <Link key={place.id} to="/local/$id" params={{ id: place.id }} className="w-36 shrink-0"><img src={place.cover} alt="" className="h-20 w-full rounded-2xl object-cover" /><span className="mt-1 block truncate text-xs font-semibold">{place.name}</span><span className="text-[10px] text-muted-foreground">{place.category}</span></Link>)}</div></Section>
    <Section title="Minha atividade" action="Visibilidade da atividade"><div className="space-y-3 text-sm">{[["Confirmou presença em um evento", "Hoje"], ["Curtiu um lugar próximo", "Ontem"], ["Publicou um novo momento", "3 dias atrás"]].map(([label, date]) => <div key={label} className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary"><Heart className="h-4 w-4" /></span><span className="flex-1">{label}</span><span className="text-[10px] text-muted-foreground">{date}</span></div>)}</div></Section>
  </main>;
}

function Editor({ draft, update, toggle, save, cancel }: { draft: DemoOwnProfile; update: UpdateProfile; toggle: (value: string) => void; save: () => void; cancel: () => void }) {
  return <main className="min-h-full bg-background pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]"><StatusBar />
    <header className="flex items-center justify-between px-5 pb-3 pt-1"><button type="button" onClick={cancel} aria-label="Cancelar edição" className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></button><h1 className="font-display text-lg font-bold">Editar perfil</h1><span className="w-9" /></header>
    <section className="px-4"><div className="overflow-hidden rounded-[30px] border border-border bg-surface"><img src={cover} alt="" className="h-28 w-full object-cover" /><div className="relative -mt-11 px-5 pb-4 text-center"><div className="relative mx-auto w-fit"><img src={draft.photo} alt="" className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg" /><span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-white"><Camera className="h-4 w-4" /></span></div><p className="mt-2 text-xs text-muted-foreground">Sua foto é visível no perfil público.</p></div></div></section>
    <section className="mx-4 mt-4 space-y-3"><Field label="Nome" value={draft.name} change={(value) => update("name", value)} /><Field label="Nome de usuário" value={`@${draft.handle}`} change={(value) => update("handle", value.replace(/^@/, ""))} /><label className="block text-xs font-semibold text-muted-foreground">Bio<textarea rows={3} value={draft.bio} onChange={(event) => update("bio", event.target.value.slice(0, 180))} className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" /></label><Field label="Cidade e região" value={draft.city} change={(value) => update("city", value)} /></section>
    <section className="mx-4 mt-6"><h2 className="font-display text-base font-bold">Endereços privados</h2><p className="mt-1 text-xs text-muted-foreground">Nunca aparecem no seu perfil público.</p><div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface"><Address icon={Home} label="Casa" /><Address icon={BriefcaseBusiness} label="Trabalho" /></div></section>
    <section className="mx-4 mt-6"><h2 className="font-display text-base font-bold">Interesses</h2><div className="mt-3 flex flex-wrap gap-2">{options.map((item) => <button key={item} type="button" onClick={() => toggle(item)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${draft.interests.includes(item) ? "border-primary/25 bg-primary/[0.09] text-primary" : "border-border bg-surface text-muted-foreground"}`}>{draft.interests.includes(item) && <Check className="mr-1 inline h-3.5 w-3.5" />}{item}</button>)}</div></section>
    <section className="mx-4 mt-6"><h2 className="font-display text-base font-bold">Quem pode ver</h2><div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface"><Privacy label="Atividade confirmada" value="Conexões" /><Privacy label="Lugares curtidos" value="Conexões" /><Privacy label="Amigos em comum" value="Todos" /></div></section>
    <div className="mx-4 mt-7 space-y-3"><button type="button" onClick={save} className="h-12 w-full rounded-2xl bg-gradient-brand text-sm font-semibold text-white shadow-soft">Salvar alterações</button><button type="button" onClick={cancel} className="h-10 w-full text-sm font-semibold text-primary">Cancelar</button></div>
  </main>;
}

function Field({ label, value, change }: { label: string; value: string; change: (value: string) => void }) { return <label className="block text-xs font-semibold text-muted-foreground">{label}<input value={value} onChange={(event) => change(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary/50" /></label>; }
function Stat({ value, label, divider = false }: { value: string; label: string; divider?: boolean }) { return <div className={divider ? "border-x border-border" : ""}><p className="font-display text-lg font-bold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>; }
function Section({ title, action, children }: { title: string; action?: string; children: ReactNode }) { return <section className="mx-4 mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-base font-bold">{title}</h2>{action && <span className="text-[10px] text-muted-foreground">{action}</span>}</div>{children}</section>; }
function Address({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) { return <button type="button" className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-0"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/[0.08] text-primary"><Icon className="h-4 w-4" /></span><span className="flex-1"><span className="block text-sm font-semibold">{label}</span><span className="text-[10px] text-muted-foreground">Somente você</span></span><Lock className="h-3.5 w-3.5 text-muted-foreground" /><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>; }
function Privacy({ label, value }: { label: string; value: string }) { return <button type="button" className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-0"><span className="flex-1 text-sm">{label}</span><span className="text-[11px] text-muted-foreground">{value}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>; }
