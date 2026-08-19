import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { PhoneFrame, StatusBar } from "@/components/phone-frame";
import { Loader2, ShieldCheck } from "lucide-react";

type OAuthClient = { name?: string | null };
type OAuthDetails = {
  client?: OAuthClient | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { returnTo: next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <PhoneFrame>
      <div className="flex-1 grid place-items-center px-6 text-center text-sm text-muted-foreground">
        Não foi possível carregar este pedido de autorização:{" "}
        {String((error as Error)?.message ?? error)}
      </div>
    </PhoneFrame>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "este aplicativo";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauthApi().approveAuthorization(authorization_id)
      : await oauthApi().denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não retornou um redirecionamento.");
      return;
    }
    window.location.href = target;
  }

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col bg-gradient-to-b from-accent/50 to-surface">
        <StatusBar />
        <div className="flex-1 flex flex-col justify-center px-6 pb-10">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="text-center font-display text-xl font-bold">
            Conectar {clientName} à sua conta
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {clientName} poderá usar o Connexy como você: ler e atualizar seu perfil, ver e publicar
            momentos, e buscar locais.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-center text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="mt-6 h-12 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Permitir acesso"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="mt-3 h-12 rounded-2xl bg-surface border border-border font-semibold disabled:opacity-70"
          >
            Recusar
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
