import { createFileRoute, Link } from "@tanstack/react-router";
import welcomeReference from "@/assets/welcome-reference.png";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Bem-vindo | Connexy" },
      {
        name: "description",
        content: "Mobilidade, pessoas e negocios locais integrados em um so aplicativo.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <main className="min-h-screen bg-white">
      <div className="relative mx-auto w-full max-w-[430px]">
        <img className="block h-auto w-full" src={welcomeReference} alt="Connexy - Tudo acontece ao seu redor" />
        <Link
          to="/cadastro"
          aria-label="Criar minha conta"
          className="absolute left-[5.7%] top-[79.9%] h-[6%] w-[88.6%] focus:outline-none"
        />
        <Link
          to="/auth"
          aria-label="Entrar com Google"
          className="absolute left-[5.7%] top-[90.4%] h-[4.8%] w-[88.6%] focus:outline-none"
        />
      </div>
    </main>
  );
}
