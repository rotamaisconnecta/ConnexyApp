import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ChevronLeft, Car, Save } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/profile/driver")({
  head: () => ({ meta: [{ title: "Motorista — Connexy" }] }),
  component: DriverProfilePage,
});

interface DriverForm {
  fullName: string;
  cnh: string;
  cnhCategory: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  vehicleYear: string;
  passengerCapacity: string;
  acceptsPet: boolean;
  acceptsBaggage: boolean;
  hasAirConditioning: boolean;
  pixKey: string;
  bankAccount: string;
  serviceArea: string;
  schedules: string;
  documentsStatus: "pending" | "approved" | "rejected";
  isOnline: boolean;
}

const INITIAL_FORM: DriverForm = {
  fullName: currentUser.name,
  cnh: "",
  cnhCategory: "B",
  vehicleBrand: "",
  vehicleModel: "",
  vehicleColor: "",
  vehiclePlate: "",
  vehicleYear: "",
  passengerCapacity: "4",
  acceptsPet: false,
  acceptsBaggage: false,
  hasAirConditioning: true,
  pixKey: "",
  bankAccount: "",
  serviceArea: "",
  schedules: "",
  documentsStatus: "pending",
  isOnline: false,
};

function DriverProfilePage() {
  const [form, setForm] = useState<DriverForm>(INITIAL_FORM);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update<K extends keyof DriverForm>(key: K, value: DriverForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex-1 pb-20">
      <StatusBar />

      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <Link
          to="/profile"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-lg">Perfil Motorista</h1>
          <p className="text-[11px] text-muted-foreground">Configure seus dados de motorista</p>
        </div>
      </header>

      <div className="px-4 space-y-4">
        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-surface p-4 shadow-soft"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${form.isOnline ? "bg-green-500" : "bg-gray-400"}`}
              />
              <div>
                <div className="text-sm font-semibold">{form.isOnline ? "Online" : "Offline"}</div>
                <div className="text-[11px] text-muted-foreground">Status de disponibilidade</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => update("isOnline", !form.isOnline)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isOnline ? "bg-primary" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isOnline ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                form.documentsStatus === "approved"
                  ? "bg-green-100 text-green-700"
                  : form.documentsStatus === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              Documentos:{" "}
              {form.documentsStatus === "approved"
                ? "Aprovados"
                : form.documentsStatus === "rejected"
                  ? "Rejeitados"
                  : "Pendentes"}
            </span>
          </div>
        </motion.div>

        {/* Dados Pessoais */}
        <Section title="Dados Pessoais">
          <Field
            label="Nome completo"
            value={form.fullName}
            onChange={(v) => update("fullName", v)}
          />
          <Field
            label="CNH"
            value={form.cnh}
            onChange={(v) => update("cnh", v)}
            placeholder="000.000.000-00"
          />
          <Field
            label="Categoria CNH"
            value={form.cnhCategory}
            onChange={(v) => update("cnhCategory", v)}
          />
        </Section>

        {/* Veículo */}
        <Section title="Veículo">
          <Field
            label="Marca"
            value={form.vehicleBrand}
            onChange={(v) => update("vehicleBrand", v)}
            placeholder="Ex: Fiat"
          />
          <Field
            label="Modelo"
            value={form.vehicleModel}
            onChange={(v) => update("vehicleModel", v)}
            placeholder="Ex: Argo"
          />
          <Field
            label="Cor"
            value={form.vehicleColor}
            onChange={(v) => update("vehicleColor", v)}
            placeholder="Ex: Branco"
          />
          <Field
            label="Placa"
            value={form.vehiclePlate}
            onChange={(v) => update("vehiclePlate", v)}
            placeholder="ABC-1234"
          />
          <Field
            label="Ano"
            value={form.vehicleYear}
            onChange={(v) => update("vehicleYear", v)}
            placeholder="2023"
          />
          <Field
            label="Nº de passageiros"
            value={form.passengerCapacity}
            onChange={(v) => update("passengerCapacity", v)}
          />
        </Section>

        {/* Preferências */}
        <Section title="Preferências">
          <Toggle
            label="Aceita Pet"
            checked={form.acceptsPet}
            onChange={(v) => update("acceptsPet", v)}
          />
          <Toggle
            label="Aceita Bagagem"
            checked={form.acceptsBaggage}
            onChange={(v) => update("acceptsBaggage", v)}
          />
          <Toggle
            label="Ar-condicionado"
            checked={form.hasAirConditioning}
            onChange={(v) => update("hasAirConditioning", v)}
          />
        </Section>

        {/* Pagamento */}
        <Section title="Pagamento">
          <Field
            label="Chave PIX"
            value={form.pixKey}
            onChange={(v) => update("pixKey", v)}
            placeholder="email@exemplo.com"
          />
          <Field
            label="Conta Bancária"
            value={form.bankAccount}
            onChange={(v) => update("bankAccount", v)}
            placeholder="0000-0 / 00000-0"
          />
        </Section>

        {/* Operação */}
        <Section title="Operação">
          <Field
            label="Área de atuação"
            value={form.serviceArea}
            onChange={(v) => update("serviceArea", v)}
            placeholder="Centro, Zona Sul..."
          />
          <Field
            label="Horários"
            value={form.schedules}
            onChange={(v) => update("schedules", v)}
            placeholder="Seg-Sex 7h-19h"
          />
        </Section>

        {/* Salvar */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-white text-sm font-semibold shadow-soft"
        >
          <Save className="h-4 w-4" />
          {saved ? "Salvo!" : "Salvar"}
        </motion.button>

        <div className="h-4" />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-surface p-4 shadow-soft space-y-3"
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
