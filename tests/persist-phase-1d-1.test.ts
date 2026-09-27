import { beforeEach, describe, expect, test } from "bun:test";
import { currentUser } from "../src/lib/mock-data";
import {
  applyDemoOnboardingInterests,
  applyDemoOnboardingProfile,
  demoOwnProfileStorageKey,
  getCanonicalDemoProfile,
  getDemoOwnProfile,
  hasStoredDemoOwnProfile,
  saveDemoOwnProfile,
  uniqueInterests,
  ageFromBirthDate,
  type DemoOwnProfile,
} from "../src/lib/demo/demo-own-profile";
import {
  clearDemoSignup,
  enterDemoSession,
  isDemoAuthenticated,
  isDemoSignupPending,
  startDemoSignup,
} from "../src/lib/demo/demo-auth";
import { getDemoIdentity } from "../src/lib/demo/demo-identity";
import {
  computePendingDemoProfileStatus,
  computeProfileStep,
} from "../src/lib/profile/profile-status";

const PROFILE_KEY = demoOwnProfileStorageKey();
const PHOTO_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==";

type MemoryStorage = Storage & { keys(): string[] };

function createMemoryStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(String(key), String(value));
    },
    keys() {
      return [...data.keys()];
    },
  } as MemoryStorage;
}

function installBrowser(storage: MemoryStorage = createMemoryStorage()): MemoryStorage {
  const win = {
    localStorage: storage,
    dispatchEvent() {
      return true;
    },
    addEventListener() {},
    removeEventListener() {},
  };
  Object.defineProperty(globalThis, "window", {
    value: win,
    configurable: true,
    writable: true,
  });
  return storage;
}

function reloadContext(): MemoryStorage {
  const snapshot = new Map<string, string>();
  const current = (globalThis as { window?: { localStorage: MemoryStorage } }).window?.localStorage;
  if (current) {
    for (const key of current.keys()) {
      const value = current.getItem(key);
      if (value != null) snapshot.set(key, value);
    }
  }
  const next = createMemoryStorage();
  for (const [key, value] of snapshot) next.setItem(key, value);
  return installBrowser(next);
}

function seedIncompleteProfile(): DemoOwnProfile {
  const stored: DemoOwnProfile = {
    name: "Perfil Antigo",
    handle: "perfil.antigo",
    photo: "https://example.test/old.jpg",
    cover: "https://example.test/cover.jpg",
    city: "Campinas, SP",
    bio: "Bio antiga",
    interests: ["Café"],
    privateAddresses: { home: "Rua das Flores, 10", work: "Av. Brasil, 200" },
    visibility: {
      confirmedActivity: "Somente você",
      likedPlaces: "Conexões",
      mutualFriends: "Todos",
    },
  };
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(stored));
  return stored;
}

function completeOnboarding() {
  applyDemoOnboardingProfile({
    name: "Ana Costa",
    handle: "ana.costa",
    bio: "Design e cafés de bairro",
    birthDate: "1994-03-20",
    photo: PHOTO_DATA_URL,
  });
  return applyDemoOnboardingInterests(["Café", "Arte", "Cinema", "Café", " arte "]);
}

beforeEach(() => {
  installBrowser();
});

describe("Fase 1D-1 — onboarding persiste o perfil canônico", () => {
  test("onboarding salva perfil na chave local existente", () => {
    expect(hasStoredDemoOwnProfile()).toBe(false);
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      bio: "Design e cafés de bairro",
      birthDate: "1994-03-20",
    });
    expect(hasStoredDemoOwnProfile()).toBe(true);
    expect(window.localStorage.getItem(PROFILE_KEY)).toBeTruthy();
  });

  test("nome é persistido", () => {
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      birthDate: "1994-03-20",
    });
    expect(getDemoOwnProfile().name).toBe("Ana Costa");
  });

  test("avatar/foto é persistido quando informado", () => {
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      birthDate: "1994-03-20",
      photo: PHOTO_DATA_URL,
    });
    expect(getDemoOwnProfile().photo).toBe(PHOTO_DATA_URL);
  });

  test("bio é persistida", () => {
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      bio: "Design e cafés de bairro",
      birthDate: "1994-03-20",
    });
    expect(getDemoOwnProfile().bio).toBe("Design e cafés de bairro");
  });

  test("idade e data de nascimento são preservadas", () => {
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      birthDate: "1994-03-20",
    });
    const profile = getDemoOwnProfile();
    expect(profile.birthDate).toBe("1994-03-20");
    expect(profile.age).toBe(ageFromBirthDate("1994-03-20"));
    expect(profile.age).toBeGreaterThan(0);
  });

  test("interesses são persistidos na ordem informada", () => {
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      birthDate: "1994-03-20",
    });
    applyDemoOnboardingInterests(["Cinema", "Arte", "Café"]);
    expect(getDemoOwnProfile().interests).toEqual(["Cinema", "Arte", "Café"]);
  });

  test("interesses não duplicam", () => {
    expect(uniqueInterests(["Café", "café", " Café ", "Arte", "Arte"])).toEqual(["Café", "Arte"]);
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      birthDate: "1994-03-20",
    });
    applyDemoOnboardingInterests(["Café", "Arte", "Cinema", "Café", " arte "]);
    expect(getDemoOwnProfile().interests).toEqual(["Café", "Arte", "Cinema"]);
  });

  test("interesses insuficientes não concluem nem alteram o perfil", () => {
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      birthDate: "1994-03-20",
    });
    expect(() => applyDemoOnboardingInterests(["Café", "Arte", " café "])).toThrow(
      "Selecione 3 ou mais interesses.",
    );
    expect(getDemoOwnProfile().interests).toEqual([]);
  });

  test("identidade atual é preservada e o perfil fica associado a ela", () => {
    const before = getDemoIdentity();
    const saved = completeOnboarding();
    const after = getDemoIdentity();
    expect(after.id).toBe(before.id);
    expect(saved.identityId).toBe(before.id);
    expect(getDemoOwnProfile().identityId).toBe(before.id);
  });

  test("onboarding não cria identidade nova", () => {
    const before = getDemoIdentity();
    completeOnboarding();
    reloadContext();
    expect(getDemoIdentity()).toEqual(before);
    expect(getDemoIdentity().id).toBe(currentUser.id);
  });
});

describe("Fase 1D-1 — reload e consulta compartilhada", () => {
  test("signup pendente retoma a etapa persistida e só termina após interesses", () => {
    enterDemoSession();
    startDemoSignup();
    expect(isDemoAuthenticated()).toBe(true);
    expect(isDemoSignupPending()).toBe(true);
    expect(computePendingDemoProfileStatus(null)).toEqual({
      authenticated: true,
      hasProfile: false,
      complete: false,
      step: "completar-perfil",
    });

    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      birthDate: "1994-03-20",
    });
    reloadContext();
    const profileStep = computeProfileStep(getDemoOwnProfile());
    expect(profileStep.step).toBe("interesses");
    expect(computePendingDemoProfileStatus(getDemoOwnProfile()).step).toBe("interesses");
    expect(isDemoSignupPending()).toBe(true);

    applyDemoOnboardingInterests(["Café", "Arte", "Cinema"]);
    expect(computePendingDemoProfileStatus(getDemoOwnProfile()).step).toBe("interesses");
    clearDemoSignup();
    reloadContext();
    expect(isDemoSignupPending()).toBe(false);
    expect(getDemoOwnProfile().interests).toEqual(["Café", "Arte", "Cinema"]);
  });

  test("reload preserva perfil, interesses e identidade", () => {
    const identity = getDemoIdentity();
    completeOnboarding();
    reloadContext();
    const profile = getDemoOwnProfile();
    expect(profile.name).toBe("Ana Costa");
    expect(profile.bio).toBe("Design e cafés de bairro");
    expect(profile.photo).toBe(PHOTO_DATA_URL);
    expect(profile.birthDate).toBe("1994-03-20");
    expect(profile.interests).toEqual(["Café", "Arte", "Cinema"]);
    expect(profile.identityId).toBe(identity.id);
    expect(getDemoIdentity().id).toBe(identity.id);
  });

  test("Home, Social e Perfil consultam o mesmo perfil canônico", () => {
    completeOnboarding();
    reloadContext();
    const canonical = getCanonicalDemoProfile();
    const home = getDemoOwnProfile();
    const socialIdentity = getDemoIdentity();
    const perfil = getDemoOwnProfile();

    expect(home).toEqual(canonical.profile);
    expect(perfil).toEqual(canonical.profile);
    expect(canonical.identityId).toBe(socialIdentity.id);
    expect(canonical.profile.identityId).toBe(socialIdentity.id);
    expect(home.name).toBe("Ana Costa");
    expect(home.interests).toEqual(["Café", "Arte", "Cinema"]);
  });

  test("edição existente continua funcionando e sobrevive a reload", () => {
    completeOnboarding();
    saveDemoOwnProfile({
      ...getDemoOwnProfile(),
      name: "Ana Costa Silva",
      city: "Santos, SP",
      bio: "Bio editada",
      interests: ["Café", "Arte", "Cinema", "Viagens"],
    });
    expect(getDemoOwnProfile().name).toBe("Ana Costa Silva");
    reloadContext();
    const reloaded = getDemoOwnProfile();
    expect(reloaded.name).toBe("Ana Costa Silva");
    expect(reloaded.city).toBe("Santos, SP");
    expect(reloaded.bio).toBe("Bio editada");
    expect(reloaded.interests).toEqual(["Café", "Arte", "Cinema", "Viagens"]);
    expect(reloaded.identityId).toBe(getDemoIdentity().id);
    expect(reloaded.birthDate).toBe("1994-03-20");
  });
});

describe("Fase 1D-1 — falhas, preservação e fonte única", () => {
  test("erro de persistência não avança o onboarding silenciosamente", () => {
    const storage = window.localStorage as MemoryStorage;
    storage.setItem = () => {
      throw new Error("quota");
    };

    expect(() =>
      applyDemoOnboardingProfile({
        name: "Ana Costa",
        handle: "ana.costa",
        birthDate: "1994-03-20",
      }),
    ).toThrow("Não foi possível salvar seu perfil. Tente novamente.");
    expect(hasStoredDemoOwnProfile()).toBe(false);
    expect(getDemoOwnProfile().name).toBe(currentUser.name);
  });

  test("falha ao salvar interesses preserva o perfil já gravado", () => {
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      bio: "Design e cafés de bairro",
      birthDate: "1994-03-20",
    });
    const before = window.localStorage.getItem(PROFILE_KEY);
    const storage = window.localStorage as MemoryStorage;
    storage.setItem = () => {
      throw new Error("quota");
    };

    expect(() => applyDemoOnboardingInterests(["Café", "Arte", "Cinema"])).toThrow(
      "Não foi possível salvar seu perfil. Tente novamente.",
    );

    expect(window.localStorage.getItem(PROFILE_KEY)).toBe(before);
    const profile = getDemoOwnProfile();
    expect(profile.name).toBe("Ana Costa");
    expect(profile.interests).toEqual([]);
  });

  test("perfil incompleto existente não é destruído", () => {
    const previous = seedIncompleteProfile();
    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "ana.costa",
      bio: "Design e cafés de bairro",
      birthDate: "1994-03-20",
    });
    const next = getDemoOwnProfile();
    expect(next.name).toBe("Ana Costa");
    expect(next.handle).toBe("ana.costa");
    expect(next.bio).toBe("Design e cafés de bairro");
    expect(next.city).toBe(previous.city);
    expect(next.cover).toBe(previous.cover);
    expect(next.privateAddresses).toEqual(previous.privateAddresses);
    expect(next.visibility).toEqual(previous.visibility);
    expect(next.interests).toEqual(previous.interests);
    expect(next.photo).toBe(previous.photo);
  });

  test("não cria segunda fonte de persistência", () => {
    completeOnboarding();
    const keys = (window.localStorage as MemoryStorage).keys();
    expect(keys).toEqual([PROFILE_KEY]);
    expect(PROFILE_KEY).toBe("connexy:demo:own-profile");
  });

  test("fluxo completo: preencher, concluir, recarregar e consultar", () => {
    expect(hasStoredDemoOwnProfile()).toBe(false);
    const identity = getDemoIdentity();

    applyDemoOnboardingProfile({
      name: "Ana Costa",
      handle: "@Ana Costa",
      bio: "Design e cafés de bairro",
      birthDate: "1994-03-20",
      photo: PHOTO_DATA_URL,
    });
    applyDemoOnboardingInterests(["Café", "Arte", "Cinema", "Café"]);

    const persisted = window.localStorage.getItem(PROFILE_KEY);
    expect(persisted).toBeTruthy();

    reloadContext();

    const canonical = getCanonicalDemoProfile();
    expect(canonical.identityId).toBe(identity.id);
    expect(canonical.profile.name).toBe("Ana Costa");
    expect(canonical.profile.handle).toBe("anacosta");
    expect(canonical.profile.bio).toBe("Design e cafés de bairro");
    expect(canonical.profile.photo).toBe(PHOTO_DATA_URL);
    expect(canonical.profile.birthDate).toBe("1994-03-20");
    expect(canonical.profile.age).toBe(ageFromBirthDate("1994-03-20"));
    expect(canonical.profile.interests).toEqual(["Café", "Arte", "Cinema"]);
    expect(canonical.profile.identityId).toBe(identity.id);
    expect(new Set(canonical.profile.interests).size).toBe(canonical.profile.interests.length);
    expect(getDemoIdentity().id).toBe(identity.id);
  });
});
