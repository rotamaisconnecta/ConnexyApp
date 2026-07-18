import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AtSign, CalendarDays, Camera, ChevronDown, Pencil, UserRound } from "lucide-react";
import { PhoneFrame, StatusBar } from "@/components/phone-frame";

export const Route = createFileRoute("/completar-perfil")({
  head: () => ({ meta: [{ title: "Complete seu perfil | Connexy" }] }),
  component: CompleteProfile,
});

function CompleteProfile() {
  const nav = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const canContinue = Boolean(name.trim() && username.trim() && birthDate);
  const maxBirthDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function selectPhoto(file?: File) {
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
  }

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto no-scrollbar bg-white text-[#16172b]">
        <StatusBar />
        <div className="px-6 pb-8 pt-4">
          <div className="flex items-center justify-between">
            <Link
              to="/cadastro"
              aria-label="Voltar"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-100 bg-white text-[#151528] shadow-soft"
            >
              <span className="text-4xl font-light leading-none">&#8249;</span>
            </Link>
            <div className="flex gap-2" aria-label="Passo 2 de 3">
              <span className="h-2 w-14 rounded-full bg-violet-100" />
              <span className="h-2 w-14 rounded-full bg-gradient-brand" />
              <span className="h-2 w-14 rounded-full bg-violet-100" />
            </div>
            <span className="w-11" />
          </div>

          <header className="mt-7 text-center">
            <p className="text-lg font-medium text-violet-600">Passo 2 de 3</p>
            <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight">Complete seu perfil</h1>
            <p className="mx-auto mt-3 max-w-[320px] text-lg leading-7 text-muted-foreground">
              Conte um pouco mais sobre voce para que possamos te conectar melhor.
            </p>
          </header>

          <div className="mt-7 flex justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="grid h-36 w-36 place-items-center overflow-hidden rounded-full border-8 border-white bg-violet-50 text-violet-600 shadow-[0_0_26px_rgba(109,40,217,0.2)]"
              >
                {photo ? (
                  <img className="h-full w-full object-cover" src={photo} alt="Foto de perfil selecionada" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-lg font-medium">
                    <Camera className="h-9 w-9 fill-violet-600" />
                    Adicionar foto
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                aria-label="Editar foto"
                className="absolute bottom-1 right-0 grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-violet-700 shadow-soft"
              >
                <Pencil className="h-5 w-5 fill-violet-700" />
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                onChange={(event) => selectPhoto(event.target.files?.[0])}
                className="hidden"
              />
            </div>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (canContinue) nav({ to: "/interesses" });
            }}
          >
            <Field label="Nome completo" icon={UserRound}>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Digite seu nome"
                className="h-14 w-full bg-transparent pr-4 text-lg outline-none placeholder:text-muted-foreground"
              />
            </Field>
            <Field label="Nome de usuario" icon={AtSign}>
              <input
                required
                value={username}
                onChange={(event) => setUsername(event.target.value.replace(/\s/g, ""))}
                placeholder="Escolha um nome de usuario"
                className="h-14 w-full bg-transparent pr-4 text-lg outline-none placeholder:text-muted-foreground"
              />
            </Field>
            <label className="block">
              <span className="mb-2 block text-lg font-medium">Bio</span>
              <span className="relative block rounded-2xl border border-violet-100 bg-white px-4 pt-3 shadow-sm">
                <textarea
                  value={bio}
                  maxLength={160}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Fale sobre voce, seus interesses, paixoes e o que te move."
                  className="h-28 w-full resize-none bg-transparent text-lg leading-7 outline-none placeholder:text-muted-foreground"
                />
                <span className="absolute bottom-3 right-4 text-sm text-muted-foreground">{bio.length}/160</span>
              </span>
            </label>
            <Field label="Data de nascimento" icon={CalendarDays} trailing={<ChevronDown className="h-5 w-5 text-muted-foreground" />}>
              <input
                required
                type="date"
                value={birthDate}
                max={maxBirthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="h-14 w-full bg-transparent pr-2 text-lg text-muted-foreground outline-none"
              />
            </Field>

            <button
              type="submit"
              disabled={!canContinue}
              className="mt-7 h-14 w-full rounded-2xl bg-gradient-brand text-xl font-semibold text-white shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar
            </button>
          </form>

          <Link to="/cadastro" className="mt-6 block text-center text-lg font-medium text-violet-600">
            Voltar
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Field({
  label,
  icon: Icon,
  trailing,
  children,
}: {
  label: string;
  icon: typeof UserRound;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-lg font-medium">{label}</span>
      <span className="flex h-14 items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4 shadow-sm">
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
        {children}
        {trailing}
      </span>
    </label>
  );
}
