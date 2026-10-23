/* =========================================================
   carona-people.ts — Resolve a identidade real de quem
   oferece a carona reutilizando o diretório social já
   existente (mock-data.findPerson + currentUser).

   Não inventa nomes nem fotos: quando a pessoa não existe
   no diretório, devolve null e a UI usa iniciais locais.
========================================================= */

import { currentUser, findPerson } from "@/lib/mock-data";

export type CaronaPerson = {
  id: string;
  name: string;
  photo: string | null;
  headline: string | null;
  interests: string[];
};

/** Identidade social de um id de usuário. Null se o id for desconhecido. */
export function resolveCaronaPerson(id: string): CaronaPerson | null {
  if (!id) return null;
  if (id === currentUser.id) {
    return {
      id: currentUser.id,
      name: currentUser.name,
      photo: currentUser.photo,
      headline: currentUser.bio ?? null,
      interests: currentUser.interests,
    };
  }
  const person = findPerson(id);
  if (!person) return null;
  return {
    id: person.id,
    name: person.name,
    photo: person.photo ?? null,
    headline: person.headline ?? person.bio ?? null,
    interests: person.interests,
  };
}

/** Primeiro nome — usado nos cartões onde a pessoa é o elemento principal. */
export function caronaPersonFirstName(person: CaronaPerson | null): string {
  if (!person) return "Alguém";
  return person.name.trim().split(/\s+/)[0] ?? person.name;
}

/** Iniciais para o fallback de avatar. */
export function caronaPersonInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}