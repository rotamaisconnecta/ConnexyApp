import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Car,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  MapPin,
  PawPrint,
  ShieldCheck,
  Snowflake,
  Upload,
  UserRound,
} from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { currentUser } from "@/lib/mock-data";
import {
  EMPTY_DRIVER_APPLICATION,
  getDriverApplication,
  saveDriverApplication,
  type DriverApplication,
} from "@/lib/driver/driver-application-storage";
import { addRole, setActiveMode } from "@/lib/roles/roles-storage";
import { UserRole } from "@/lib/roles/roles-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/driver/cadastro")({
  head: () => ({ meta: [{ title: "Torne-se motorista — Connexy" }] }),
  component: DriverRegistration,
});

const STEPS = [
  "Boas-vindas",
  "Sobre você",
  "Identidade",
  "Sua CNH",
  "Seu veículo",
  "Documentos",
  "Revisão",
] as const;

function DriverRegistration() {
  const navigate = useNavigate();
  const [application, setApplication] = useState<DriverApplication>(() => {
    const stored = getDriverApplication();
    if (stored.personal.fullName) return stored;
    return {
      ...EMPTY_DRIVER_APPLICATION,
      personal: { ...EMPTY_DRIVER_APPLICATION.personal, fullName: currentUser.name },
    };
  });
  const [direction, setDirection] = useState(1);

  useEffect(() => saveDriverApplication(application), [application]);

  const step = Math.min(application.currentStep, STEPS.length - 1);
  const hasReviewStatus = application.status !== "draft";

  function update(next: (current: DriverApplication) => DriverApplication) {
    setApplication((current) => next(current));
  }

  function goTo(nextStep: number) {
    setDirection(nextStep >= step ? 1 : -1);
    update((current) => ({
      ...current,
      status: current.status === "rejected" ? "draft" : current.status,
      currentStep: Math.max(0, Math.min(nextStep, STEPS.length - 1)),
    }));
  }

  function next() {
    if (step === 2 && !application.identity.selfieName) {
      toast.error("A selfie é necessária para continuar.");
      return;
    }
    goTo(step + 1);
  }

  function submit() {
    if (!application.identity.selfieName) {
      toast.error("Adicione sua selfie antes de enviar o cadastro.");
      goTo(2);
      return;
    }
    update((current) => ({
      ...current,
      status: "pending",
      currentStep: STEPS.length - 1,
      submittedAt: new Date().toISOString(),
      rejectionReason: undefined,
    }));
  }

  function activateDriverMode() {
    if (application.status !== "approved") return;
    addRole(UserRole.DRIVER);
    setActiveMode(UserRole.DRIVER);
    window.dispatchEvent(new Event("roleChanged"));
    navigate({ to: "/driver" });
  }

  if (hasReviewStatus) {
    return (
      <RegistrationShell
        title="Torne-se motorista"
        step={STEPS.length}
        onBack={() => navigate({ to: "/privacidade" })}
        hideProgress
      >
        {application.status === "pending" && (
          <StatusScreen
            icon={<Clock3 className="h-10 w-10" />}
            eyebrow="Cadastro recebido"
            title="Estamos analisando tudo"
            description="Sua selfie e os dados enviados estão com a equipe técnica. Você continuará no modo usuário até a aprovação."
            tone="yellow"
          >
            <div className="space-y-2 rounded-[1.4rem] border border-border bg-white/75 p-4 backdrop-blur-xl">
              <StatusRow label="Cadastro enviado" status="Concluído" complete />
              <StatusRow label="Validação de segurança" status="Em análise" active />
              <StatusRow label="Liberação do modo motorista" status="Aguardando" />
            </div>
            <Notice>
              A aprovação é feita exclusivamente pela equipe técnica. Enquanto isso, você pode
              continuar usando o Connexy normalmente.
            </Notice>
            <SecondaryButton onClick={() => navigate({ to: "/home" })}>
              Voltar ao Connexy
            </SecondaryButton>
          </StatusScreen>
        )}

        {application.status === "approved" && (
          <StatusScreen
            icon={<CheckCircle2 className="h-11 w-11" />}
            eyebrow="Análise concluída"
            title="Você já pode dirigir"
            description="Seu cadastro foi aprovado pela equipe Connexy. Agora o Modo Motorista está disponível."
            tone="green"
          >
            <Notice>
              No Modo Motorista, Pessoas Próximas, conversas e solicitações sociais ficam
              desativadas para preservar sua atenção e segurança.
            </Notice>
            <PrimaryButton onClick={activateDriverMode}>Ativar Modo Motorista</PrimaryButton>
          </StatusScreen>
        )}

        {application.status === "rejected" && (
          <StatusScreen
            icon={<FileCheck2 className="h-10 w-10" />}
            eyebrow="Precisamos de um ajuste"
            title="Revise seu cadastro"
            description={
              application.rejectionReason ||
              "A equipe técnica encontrou informações que precisam ser atualizadas."
            }
            tone="red"
          >
            <PrimaryButton onClick={() => goTo(1)}>Revisar informações</PrimaryButton>
          </StatusScreen>
        )}
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell
      title={STEPS[step]}
      step={step + 1}
      onBack={() => (step === 0 ? navigate({ to: "/privacidade" }) : goTo(step - 1))}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -20 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="flex min-h-full flex-col"
        >
          {step === 0 && <WelcomeStep onContinue={next} />}
          {step === 1 && (
            <PersonalStep
              value={application.personal}
              onChange={(personal) => update((current) => ({ ...current, personal }))}
              onContinue={next}
            />
          )}
          {step === 2 && (
            <IdentityStep
              value={application.identity}
              onChange={(identity) => update((current) => ({ ...current, identity }))}
              onContinue={next}
            />
          )}
          {step === 3 && (
            <LicenseStep
              value={application.license}
              onChange={(license) => update((current) => ({ ...current, license }))}
              onContinue={next}
            />
          )}
          {step === 4 && (
            <VehicleStep
              value={application.vehicle}
              onChange={(vehicle) => update((current) => ({ ...current, vehicle }))}
              onContinue={next}
            />
          )}
          {step === 5 && (
            <DocumentsStep
              value={application.documents}
              onChange={(documents) => update((current) => ({ ...current, documents }))}
              onContinue={next}
            />
          )}
          {step === 6 && <ReviewStep application={application} onEdit={goTo} onSubmit={submit} />}
        </motion.div>
      </AnimatePresence>
    </RegistrationShell>
  );
}

function RegistrationShell({
  title,
  step,
  onBack,
  hideProgress = false,
  children,
}: {
  title: string;
  step: number;
  onBack: () => void;
  hideProgress?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[linear-gradient(180deg,#fffdf5_0%,#ffffff_36%)] pb-24">
      <StatusBar />
      <header className="px-5 pb-4 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full border border-black/5 bg-white/75 shadow-sm backdrop-blur-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">
              Connexy Motorista
            </p>
            <h1 className="truncate font-display text-lg font-bold">{title}</h1>
          </div>
          {!hideProgress && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
              {step} de {STEPS.length}
            </span>
          )}
        </div>
        {!hideProgress && (
          <div className="mt-4 flex gap-1.5" aria-label={`Etapa ${step} de ${STEPS.length}`}>
            {STEPS.map((item, index) => (
              <span
                key={item}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  index < step ? "bg-[#FFC107]" : "bg-black/6",
                )}
              />
            ))}
          </div>
        )}
      </header>
      <main className="flex-1 px-5">{children}</main>
    </div>
  );
}

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="relative mt-2 overflow-hidden rounded-[2rem] bg-[#120F19] px-6 pb-7 pt-8 text-white shadow-elegant">
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#FFC107]/25 blur-3xl" />
        <div className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-[1.1rem] bg-[#FFC107] text-black">
            <Car className="h-6 w-6" />
          </span>
          <h2 className="mt-8 font-display text-[2rem] font-bold leading-[1.04]">
            Dirija no seu ritmo.
          </h2>
          <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-white/70">
            Mais liberdade, oportunidades próximas e toda a cidade trabalhando a seu favor.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <Benefit icon={Gauge} title="Ganhe no seu ritmo" text="Você escolhe quando dirigir." />
        <Benefit
          icon={MapPin}
          title="Veja onde a cidade acontece"
          text="Eventos e regiões em alta no seu mapa."
        />
        <Benefit
          icon={ShieldCheck}
          title="Segurança em cada viagem"
          text="Cadastro analisado pela equipe técnica."
        />
      </div>
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onContinue}>Começar cadastro</PrimaryButton>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Somente a selfie é obrigatória nesta etapa.
        </p>
      </div>
    </div>
  );
}

function PersonalStep({
  value,
  onChange,
  onContinue,
}: {
  value: DriverApplication["personal"];
  onChange: (value: DriverApplication["personal"]) => void;
  onContinue: () => void;
}) {
  return (
    <StepContent
      icon={UserRound}
      title="Conte um pouco sobre você"
      description="Todos os campos podem ser preenchidos agora ou atualizados depois."
      onContinue={onContinue}
    >
      <Field
        label="Nome completo"
        value={value.fullName}
        onChange={(fullName) => onChange({ ...value, fullName })}
      />
      <Field
        label="CPF"
        value={value.cpf}
        onChange={(cpf) => onChange({ ...value, cpf })}
        placeholder="000.000.000-00"
        inputMode="numeric"
      />
      <Field
        label="Data de nascimento"
        type="date"
        value={value.birthDate}
        onChange={(birthDate) => onChange({ ...value, birthDate })}
      />
      <Field
        label="Celular"
        value={value.phone}
        onChange={(phone) => onChange({ ...value, phone })}
        placeholder="(00) 00000-0000"
        inputMode="tel"
      />
      <Field
        label="Cidade"
        value={value.city}
        onChange={(city) => onChange({ ...value, city })}
        placeholder="Onde você deseja dirigir?"
      />
    </StepContent>
  );
}

function IdentityStep({
  value,
  onChange,
  onContinue,
}: {
  value: DriverApplication["identity"];
  onChange: (value: DriverApplication["identity"]) => void;
  onContinue: () => void;
}) {
  return (
    <StepContent
      icon={Camera}
      title="Confirme sua identidade"
      description="Sua selfie protege passageiros, motoristas e toda a comunidade."
      onContinue={onContinue}
      continueDisabled={!value.selfieName}
      continueLabel={value.selfieName ? "Continuar" : "Adicione sua selfie"}
    >
      <UploadField
        title="Selfie"
        description="Foto nítida, de frente e com boa iluminação."
        required
        accept="image/*"
        capture="user"
        fileName={value.selfieName}
        onFile={(selfieName) => onChange({ ...value, selfieName })}
      />
      <UploadField
        title="Documento de identidade"
        description="RG ou documento oficial com foto."
        accept="image/*,.pdf"
        fileName={value.identityDocumentName}
        onFile={(identityDocumentName) => onChange({ ...value, identityDocumentName })}
      />
      <Notice>Seus arquivos ficam protegidos e são usados somente para validação.</Notice>
    </StepContent>
  );
}

function LicenseStep({
  value,
  onChange,
  onContinue,
}: {
  value: DriverApplication["license"];
  onChange: (value: DriverApplication["license"]) => void;
  onContinue: () => void;
}) {
  return (
    <StepContent
      icon={FileText}
      title="Dados da sua CNH"
      description="Preencha o que tiver em mãos. Você poderá editar antes de enviar."
      onContinue={onContinue}
    >
      <UploadField
        title="Foto da CNH"
        description="Frente e verso ou arquivo digital."
        accept="image/*,.pdf"
        fileName={value.documentName}
        onFile={(documentName) => onChange({ ...value, documentName })}
      />
      <Field
        label="Número da CNH"
        value={value.number}
        onChange={(number) => onChange({ ...value, number })}
      />
      <Field
        label="Categoria"
        value={value.category}
        onChange={(category) => onChange({ ...value, category })}
        placeholder="Ex.: B"
      />
      <Field
        label="Validade"
        type="date"
        value={value.expiry}
        onChange={(expiry) => onChange({ ...value, expiry })}
      />
    </StepContent>
  );
}

function VehicleStep({
  value,
  onChange,
  onContinue,
}: {
  value: DriverApplication["vehicle"];
  onChange: (value: DriverApplication["vehicle"]) => void;
  onContinue: () => void;
}) {
  return (
    <StepContent
      icon={Car}
      title="Agora, o seu veículo"
      description="As informações ajudam a equipe a analisar a categoria adequada."
      onContinue={onContinue}
    >
      <UploadField
        title="Foto do veículo"
        description="Uma foto externa, com boa iluminação."
        accept="image/*"
        fileName={value.photoName}
        onFile={(photoName) => onChange({ ...value, photoName })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Marca"
          value={value.brand}
          onChange={(brand) => onChange({ ...value, brand })}
        />
        <Field
          label="Modelo"
          value={value.model}
          onChange={(model) => onChange({ ...value, model })}
        />
        <Field
          label="Ano"
          value={value.year}
          onChange={(year) => onChange({ ...value, year })}
          inputMode="numeric"
        />
        <Field
          label="Cor"
          value={value.color}
          onChange={(color) => onChange({ ...value, color })}
        />
        <Field
          label="Placa"
          value={value.plate}
          onChange={(plate) => onChange({ ...value, plate })}
        />
        <Field
          label="Passageiros"
          value={value.capacity}
          onChange={(capacity) => onChange({ ...value, capacity })}
          inputMode="numeric"
        />
      </div>
      <div className="rounded-[1.4rem] border border-border bg-white/75 p-2 backdrop-blur-xl">
        <ToggleRow
          icon={Snowflake}
          label="Ar-condicionado"
          checked={value.airConditioning}
          onChange={(airConditioning) => onChange({ ...value, airConditioning })}
        />
        <ToggleRow
          icon={PawPrint}
          label="Aceita pet"
          checked={value.acceptsPet}
          onChange={(acceptsPet) => onChange({ ...value, acceptsPet })}
        />
        <ToggleRow
          icon={FileCheck2}
          label="Espaço para bagagem"
          checked={value.baggage}
          onChange={(baggage) => onChange({ ...value, baggage })}
        />
      </div>
    </StepContent>
  );
}

function DocumentsStep({
  value,
  onChange,
  onContinue,
}: {
  value: DriverApplication["documents"];
  onChange: (value: DriverApplication["documents"]) => void;
  onContinue: () => void;
}) {
  return (
    <StepContent
      icon={FileCheck2}
      title="Documentos do veículo"
      description="Você pode enviar agora ou deixar para completar depois da análise inicial."
      onContinue={onContinue}
    >
      <UploadField
        title="CRLV"
        description="Documento mais recente do veículo."
        accept="image/*,.pdf"
        fileName={value.vehicleDocumentName}
        onFile={(vehicleDocumentName) => onChange({ ...value, vehicleDocumentName })}
      />
      <UploadField
        title="Comprovante de residência"
        description="Conta de consumo ou documento equivalente."
        accept="image/*,.pdf"
        fileName={value.residenceProofName}
        onFile={(residenceProofName) => onChange({ ...value, residenceProofName })}
      />
      <Notice>
        Campos vazios não impedem o envio, mas a equipe poderá solicitar complementos durante a
        análise.
      </Notice>
    </StepContent>
  );
}

function ReviewStep({
  application,
  onEdit,
  onSubmit,
}: {
  application: DriverApplication;
  onEdit: (step: number) => void;
  onSubmit: () => void;
}) {
  const sections = useMemo(
    () => [
      { title: "Você", step: 1, summary: application.personal.fullName || "Não informado" },
      {
        title: "Identidade",
        step: 2,
        summary: application.identity.selfieName ? "Selfie adicionada" : "Selfie pendente",
      },
      {
        title: "CNH",
        step: 3,
        summary: application.license.number || application.license.documentName || "Não informada",
      },
      {
        title: "Veículo",
        step: 4,
        summary:
          [application.vehicle.brand, application.vehicle.model].filter(Boolean).join(" ") ||
          "Não informado",
      },
      {
        title: "Documentos",
        step: 5,
        summary: application.documents.vehicleDocumentName || "Podem ser enviados depois",
      },
    ],
    [application],
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-5">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold">Revise antes de enviar</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tudo continua editável. Somente a selfie precisa estar anexada.
        </p>
      </div>
      <div className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.title}
            type="button"
            onClick={() => onEdit(section.step)}
            className="flex w-full items-center gap-3 rounded-[1.25rem] border border-border bg-white/80 p-4 text-left shadow-sm backdrop-blur-xl"
          >
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full",
                section.title === "Identidade" && application.identity.selfieName
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {section.title === "Identidade" && application.identity.selfieName ? (
                <Check className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{section.title}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {section.summary}
              </span>
            </span>
            <span className="text-[11px] font-bold text-amber-700">Editar</span>
          </button>
        ))}
      </div>
      <div className="mt-auto pt-7">
        <Notice>
          Ao enviar, seu cadastro ficará indisponível para atuação até a aprovação da equipe
          técnica.
        </Notice>
        <div className="mt-4">
          <PrimaryButton onClick={onSubmit}>Enviar para análise</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function StepContent({
  icon: Icon,
  title,
  description,
  children,
  onContinue,
  continueDisabled = false,
  continueLabel = "Continuar",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-5">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <Icon className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-3 inline-flex rounded-full bg-black/[0.035] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          Campos opcionais, exceto quando indicado
        </span>
      </div>
      <div className="space-y-3">{children}</div>
      <div className="mt-auto pt-7">
        <PrimaryButton onClick={onContinue} disabled={continueDisabled}>
          {continueLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block rounded-[1.15rem] border border-border bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || "Opcional"}
        className="mt-1 w-full bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/55"
      />
    </label>
  );
}

function UploadField({
  title,
  description,
  fileName,
  onFile,
  accept,
  capture,
  required = false,
}: {
  title: string;
  description: string;
  fileName: string;
  onFile: (name: string) => void;
  accept: string;
  capture?: "user" | "environment";
  required?: boolean;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-4 rounded-[1.4rem] border border-border bg-white/80 p-4 shadow-sm backdrop-blur-xl transition hover:border-amber-300">
      <span
        className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
          fileName ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-700",
        )}
      >
        {fileName ? <Check className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-bold">
          {title}
          {required && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
              Obrigatória
            </span>
          )}
        </span>
        <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
          {fileName || description}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
      <input
        type="file"
        className="sr-only"
        accept={accept}
        capture={capture}
        onChange={(event) => onFile(event.target.files?.[0]?.name || "")}
      />
    </label>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left"
    >
      <Icon className="h-4 w-4 text-amber-600" />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-[#FFC107]" : "bg-black/10",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Benefit({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-[1.3rem] border border-amber-200/70 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-950">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p>{children}</p>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-[#FFC107] px-5 py-4 text-sm font-bold text-black shadow-[0_12px_28px_rgba(255,193,7,.22)] transition disabled:cursor-not-allowed disabled:bg-black/8 disabled:text-muted-foreground disabled:shadow-none"
    >
      {children}
      {!disabled && <ArrowRight className="h-4 w-4" />}
    </motion.button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[1.2rem] border border-border bg-white/80 px-5 py-4 text-sm font-bold shadow-sm backdrop-blur-xl"
    >
      {children}
    </button>
  );
}

function StatusScreen({
  icon,
  eyebrow,
  title,
  description,
  tone,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone: "yellow" | "green" | "red";
  children: React.ReactNode;
}) {
  const tones = {
    yellow: "bg-amber-100 text-amber-600",
    green: "bg-emerald-100 text-emerald-600",
    red: "bg-red-100 text-red-600",
  };
  return (
    <div className="flex min-h-full flex-col pt-8 text-center">
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn("mx-auto grid h-24 w-24 place-items-center rounded-[2rem]", tones[tone])}
      >
        {icon}
      </motion.div>
      <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold">{title}</h2>
      <p className="mx-auto mt-3 max-w-[19rem] text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-8 space-y-4 text-left">{children}</div>
    </div>
  );
}

function StatusRow({
  label,
  status,
  complete = false,
  active = false,
}: {
  label: string;
  status: string;
  complete?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className={cn(
          "grid h-7 w-7 place-items-center rounded-full",
          complete
            ? "bg-emerald-100 text-emerald-600"
            : active
              ? "bg-amber-100 text-amber-600"
              : "bg-black/5 text-muted-foreground",
        )}
      >
        {complete ? (
          <Check className="h-3.5 w-3.5" />
        ) : active ? (
          <Clock3 className="h-3.5 w-3.5" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <span className="text-[11px] text-muted-foreground">{status}</span>
    </div>
  );
}
