import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { UserRound, Camera, PenLine, Smile, Eye, Loader2 } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { useAuth } from "@/hooks/use-auth";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { ProfileRepository } from "@/repositories/profile.repository";
import { FeedRepository } from "@/repositories/feed.repository";
import { toast } from "sonner";
import type { ProfileRow, BioPostRow } from "@/types/database/tables";

import { BioSection } from "@/components/bio/bio-section";
import { BioPersonalDataSection } from "@/components/bio/bio-personal-data";
import { BioAvatarSection } from "@/components/bio/bio-avatar";
import { BioPostsSection } from "@/components/bio/bio-posts";
import { BioMoodSection } from "@/components/bio/bio-mood";
import { BioInterestsSection } from "@/components/bio/bio-interests";

export const Route = createFileRoute("/_app/gerenciar/bio")({
  head: () => ({ meta: [{ title: "Gerenciar Bio — Connexy" }] }),
  component: GerenciarBio,
});

function GerenciarBio() {
  const { user } = useAuth();
  const configured = isPublicSupabaseConfigured();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BioPostRow[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dados: true,
    foto: false,
    posts: false,
    humor: false,
    interesses: false,
    preview: false,
  });

  const toggleSection = useCallback(
    (key: string) => setExpandedSections((s) => ({ ...s, [key]: !s[key] })),
    [],
  );

  useEffect(() => {
    if (!user || !configured) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [p, userPosts] = await Promise.all([
          ProfileRepository.getProfile(user.id),
          FeedRepository.getByAuthor(user.id),
        ]);
        setProfile(p);
        setPosts(userPosts);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, configured]);

  const handleProfileSaved = useCallback((updated: ProfileRow) => {
    setProfile(updated);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <StatusBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex-1 flex flex-col">
        <StatusBar />
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nao foi possivel carregar seu perfil. Verifique sua conexao.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-24 overflow-y-auto no-scrollbar">
      <StatusBar />
      <header className="px-4 pt-1 pb-3 flex items-center gap-2">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className="flex-1 font-display font-bold text-lg">Gerenciar minha bio</h1>
      </header>

      <BioSection
        title="Dados pessoais"
        icon={<UserRound className="h-4 w-4" />}
        expanded={expandedSections.dados}
        onToggle={() => toggleSection("dados")}
      >
        <BioPersonalDataSection
          profile={profile}
          userId={user.id}
          configured={configured}
          onSaved={handleProfileSaved}
        />
      </BioSection>

      <BioSection
        title="Foto de perfil"
        icon={<Camera className="h-4 w-4" />}
        expanded={expandedSections.foto}
        onToggle={() => toggleSection("foto")}
      >
        <BioAvatarSection
          profile={profile}
          userId={user.id}
          configured={configured}
          onSaved={handleProfileSaved}
        />
      </BioSection>

      <BioSection
        title={`Publicacoes (${posts.length})`}
        icon={<PenLine className="h-4 w-4" />}
        expanded={expandedSections.posts}
        onToggle={() => toggleSection("posts")}
      >
        <BioPostsSection
          posts={posts}
          userId={user.id}
          configured={configured}
          onPostsChanged={setPosts}
        />
      </BioSection>

      <BioSection
        title="Humor e momento"
        icon={<Smile className="h-4 w-4" />}
        expanded={expandedSections.humor}
        onToggle={() => toggleSection("humor")}
      >
        <BioMoodSection
          profile={profile}
          userId={user.id}
          configured={configured}
          onSaved={handleProfileSaved}
        />
      </BioSection>

      <BioSection
        title="Interesses e vibe"
        icon={<Smile className="h-4 w-4" />}
        expanded={expandedSections.interesses}
        onToggle={() => toggleSection("interesses")}
      >
        <BioInterestsSection
          profile={profile}
          userId={user.id}
          configured={configured}
          onSaved={handleProfileSaved}
        />
      </BioSection>

      <BioSection
        title="Preview do perfil"
        icon={<Eye className="h-4 w-4" />}
        expanded={expandedSections.preview}
        onToggle={() => toggleSection("preview")}
      >
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Veja como outros enxergam seu perfil.</p>
          <Link
            to="/perfil/$id"
            params={{ id: user.id }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-brand text-white px-5 py-2.5 text-sm font-semibold shadow-soft hover:opacity-90 transition-opacity"
          >
            <Eye className="h-4 w-4" />
            Abrir meu perfil
          </Link>
        </div>
      </BioSection>
    </div>
  );
}
