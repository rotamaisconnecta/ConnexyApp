import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { SmartFeed } from "@/components/feed/SmartFeed";
import { Logo } from "@/lib/branding/brand-config";

export const Route = createFileRoute("/_app/feed")({
  head: () => ({ meta: [{ title: "Feed — Connexy" }] }),
  component: FeedPage,
});

function FeedPage() {
  return (
    <div className="flex-1 pb-6">
      <StatusBar />

      <header className="px-5 pt-1 pb-3">
        <img src={Logo.default} alt="Connexy" className="h-8" />
      </header>

      <SmartFeed />
    </div>
  );
}
