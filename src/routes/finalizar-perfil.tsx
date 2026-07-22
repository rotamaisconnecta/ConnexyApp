import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { BadgeCheck, ImagePlus, MapPin, Plus, ShieldCheck, UserRound } from "lucide-react";
import { PhoneFrame, StatusBar } from "@/components/phone-frame";

export const Route = createFileRoute("/finalizar-perfil")({
  head: () => ({ meta: [{ title: "Finalize seu perfil | Connexy" }] }),
  component: FinishProfile,
});

const statuses = [
  { label: "Disponivel", color: "bg-emerald-500" },
  { label: "Ocupado", color: "bg-amber-500" },
  { label: "Relaxando", color: "bg-sky-500" },
  { label: "Nao perturbe", color: "bg-rose-500" },
];

function FinishProfile() {
  const nav = useNavigate();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [photos, setPhotos] = useState<Array<string | null>>([null, null, null, null, null]);
  const [gender, setGender] = useState("Masculino");
  const [status, setStatus] = useState("Disponivel");

  function addPhoto(index: number, file?: File) {
    if (!file) return;
    setPhotos((current) =>
      current.map((photo, photoIndex) =>
        photoIndex === index ? URL.createObjectURL(file) : photo,
      ),
    );
  }

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto no-scrollbar bg-white text-[#16172b]">
        <StatusBar />
        <div className="px-6 pb-8 pt-4">
          <div className="flex items-center justify-between">
            <Link
              to="/interesses"
              aria-label="Voltar"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-100 bg-white text-[#151528] shadow-soft"
            >
              <span className="text-4xl font-light leading-none">&#8249;</span>
            </Link>
            <div className="flex gap-2" aria-label="Passo 4 de 4">
              {[0, 1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={`h-2 w-10 rounded-full ${step === 3 ? "bg-gradient-brand" : "bg-violet-200"}`}
                />
              ))}
            </div>
            <span className="w-11" />
          </div>

          <header className="mt-7 text-center">
            <p className="text-lg font-medium text-violet-600">Passo 4 de 4</p>
            <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight">
              Quase pronto! <span aria-hidden>✦</span>
            </h1>
            <p className="mx-auto mt-3 max-w-[330px] text-lg leading-7 text-muted-foreground">
              Personalize seu perfil e comece a se conectar com o que importa.
            </p>
          </header>

          <section className="mt-9">
            <h2 className="text-xl font-semibold">Adicione suas fotos</h2>
            <p className="mt-1 text-base text-muted-foreground">
              Mostre quem voce e! Adicione pelo menos 1 foto.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => inputs.current[index]?.click()}
                  className={`relative aspect-square overflow-hidden rounded-2xl ${index === 0 ? "row-span-2 bg-violet-50" : "border border-dashed border-violet-200 bg-white"}`}
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={`Foto ${index + 1} do perfil`}
                      className="h-full w-full object-cover"
                    />
                  ) : index === 0 ? (
                    <span className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center text-lg font-medium text-violet-600">
                      <ImagePlus className="h-10 w-10" />
                      Adicionar foto principal
                    </span>
                  ) : (
                    <Plus className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted p-1.5 text-muted-foreground" />
                  )}
                  <input
                    ref={(element) => {
                      inputs.current[index] = element;
                    }}
                    type="file"
                    accept="image/*"
                    onChange={(event) => addPhoto(index, event.target.files?.[0])}
                    className="hidden"
                  />
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Genero</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Masculino", "Feminino", "Outro"].map((option) => {
                const selected = gender === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGender(option)}
                    className={`flex h-12 items-center justify-center gap-2 rounded-full border text-sm font-medium ${selected ? "border-violet-500 bg-violet-50 text-violet-700" : "border-violet-100 text-muted-foreground"}`}
                  >
                    <UserRound className="h-4 w-4" />
                    {option}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Localizacao aproximada</h2>
            <div className="mt-3 flex h-14 items-center gap-3 rounded-2xl border border-violet-100 px-4 shadow-sm">
              <MapPin className="h-5 w-5 text-violet-600" />
              <span className="min-w-0 flex-1 truncate text-lg">Sao Paulo, SP - Brasil</span>
              <button type="button" className="font-medium text-violet-600">
                Alterar
              </button>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Status</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {statuses.map(({ label, color }) => {
                const selected = label === status;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStatus(label)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium ${selected ? "border-violet-500 bg-violet-50 text-violet-700" : "border-violet-100 text-muted-foreground"}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              Verificacao de perfil{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </h2>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-violet-100 p-3 shadow-sm">
              <ShieldCheck className="h-8 w-8 shrink-0 text-violet-600" />
              <p className="min-w-0 flex-1 text-sm leading-5 text-muted-foreground">
                Verifique seu perfil e ganhe mais confianca da comunidade.
              </p>
              <button
                type="button"
                className="shrink-0 rounded-xl border border-violet-500 px-3 py-2 text-sm font-medium text-violet-600"
              >
                Verificar agora
              </button>
            </div>
          </section>

          <button
            type="button"
            disabled={!photos[0]}
            onClick={() => nav({ to: "/localizacao" })}
            className="mt-8 h-14 w-full rounded-2xl bg-gradient-brand text-xl font-semibold text-white shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
          >
            Criar meu perfil
          </button>
          <Link
            to="/interesses"
            className="mt-6 block text-center text-lg font-medium text-violet-600"
          >
            Voltar
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
