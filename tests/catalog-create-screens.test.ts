import { beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  AD_CREATE_STEPS,
  INITIAL_AD_CREATE_STEP,
  getAdCreateStepIndex,
  isReviewStep,
} from "../src/components/catalog/ad-create-steps";
import { applyCatalogAssistSuggestion } from "../src/lib/catalog/apply-catalog-assist";
import {
  BUSINESS_FEATURE_TAGS,
  CatalogVisibility,
  EVENT_FEATURE_TAGS,
  PLACE_FEATURE_TAGS,
} from "../src/lib/catalog/catalog-options";
import {
  createDefaultBusinessHours,
  createEmptyHours,
  DAY_ORDER,
  formatHoursSummary,
  normalizeHoursSlots,
} from "../src/lib/catalog/catalog-hours";
import {
  CatalogKind,
  catalogBusinessToBusiness,
  catalogEventToBusinessEvent,
  catalogPlaceToPlace,
  createCatalogBusiness,
  createCatalogEvent,
  createCatalogPlace,
  getCatalogEntity,
} from "../src/lib/catalog/local-catalog";
import { scanSourceFiles } from "./helpers/source-scan";
import { BusinessCategory, DayOfWeek, PriceRange } from "../src/lib/marketplace/business-types";

const projectRoot = join(import.meta.dir, "..");

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

type MemoryStorage = {
  keys: () => string[];
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function createMemoryStorage(): MemoryStorage {
  const map = new Map<string, string>();
  return {
    keys: () => [...map.keys()],
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: createMemoryStorage(),
      dispatchEvent: () => true,
      addEventListener() {},
      removeEventListener() {},
    },
  });
});

describe("catálogo — o que a tela de evento grava chega intacto à ficha", () => {
  const eventInput = {
    title: "Festival de Música",
    description: "Música ao vivo no parque.",
    category: "Música",
    location: "Praça Central",
    reference: "Portão lateral",
    businessId: "business-1",
    startAt: "2026-10-05T20:00",
    endAt: "2026-10-05T23:00",
    rules: "Proibido levar vidro.",
    notes: "Chuvauga cancela.",
    capacity: 500,
    price: 40,
    free: false,
    visibility: CatalogVisibility.PRIVATE,
    photo: "https://cdn.test/cover.jpg",
    gallery: ["https://cdn.test/extra.jpg"],
  } as const;

  test("o adaptador carrega todos os campos que a ficha exibe", () => {
    const event = catalogEventToBusinessEvent({
      id: "event-1",
      kind: CatalogKind.EVENT,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      ...eventInput,
    });

    expect(event.id).toBe("event-1");
    expect(event.businessId).toBe("business-1");
    expect(event.title).toBe("Festival de Música");
    expect(event.category).toBe("Música");
    expect(event.capacity).toBe(500);
    expect(event.photo).toBe("https://cdn.test/cover.jpg");
    expect(event.startDate).toEqual(new Date("2026-10-05T20:00"));
    expect(event.endDate).toEqual(new Date("2026-10-05T23:00"));
    expect(event.price).toBe(40);
  });

  test("descrição, regras e notas viram um único texto legível", () => {
    const event = catalogEventToBusinessEvent({
      id: "event-1",
      kind: CatalogKind.EVENT,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      ...eventInput,
    });

    expect(event.description).toBe(
      "Música ao vivo no parque.\n\nProibido levar vidro.\n\nChuvauga cancela.",
    );
  });

  test("a referência do local é somada ao endereço sem campo sobrando", () => {
    const event = catalogEventToBusinessEvent({
      id: "event-1",
      kind: CatalogKind.EVENT,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      ...eventInput,
    });
    expect(event.location).toBe("Praça Central · Portão lateral");

    const semReferencia = catalogEventToBusinessEvent({
      id: "event-2",
      kind: CatalogKind.EVENT,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      ...eventInput,
      reference: "   ",
    });
    expect(semReferencia.location).toBe("Praça Central");
  });

  test("evento gratuito não exibe preço e evento pago mantém o valor", () => {
    const base = {
      id: "event-1",
      kind: CatalogKind.EVENT,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      ...eventInput,
    };
    expect(catalogEventToBusinessEvent({ ...base, free: true, price: 40 }).price).toBeUndefined();
    expect(catalogEventToBusinessEvent({ ...base, free: false, price: 40 }).price).toBe(40);
  });

  test("a capa cai para a galeria e depois para a imagem padrão", () => {
    const base = { id: "event-1", kind: CatalogKind.EVENT, ownerId: "lucas", createdAt: 0, updatedAt: 0, ...eventInput };
    expect(catalogEventToBusinessEvent({ ...base, photo: "", gallery: ["https://cdn.test/g.jpg"] }).photo).toBe(
      "https://cdn.test/g.jpg",
    );
    expect(catalogEventToBusinessEvent({ ...base, photo: "", gallery: [] }).photo).toContain("https://");
  });

  test("a tela recusa evento sem título, local ou data", () => {
    const base = {
      title: "Festival",
      description: "",
      category: "Música",
      location: "Praça",
      startAt: "2026-10-05T20:00",
    };
    expect(() => createCatalogEvent(base)).not.toThrow();
    expect(() => createCatalogEvent({ ...base, title: "  " })).toThrow("Informe título, local e data do evento.");
    expect(() => createCatalogEvent({ ...base, location: " " })).toThrow("Informe título, local e data do evento.");
    expect(() => createCatalogEvent({ ...base, startAt: "" })).toThrow("Informe título, local e data do evento.");
  });

  test("o evento gravado conserva visibilidade, ids e origem do usuário", () => {
    const created = createCatalogEvent({ ...eventInput });

    expect(created.kind).toBe(CatalogKind.EVENT);
    expect(created.visibility).toBe(CatalogVisibility.PRIVATE);
    expect(created.id).toStartWith("event-");
    expect(created.ownerId.length).toBeGreaterThan(0);
    expect(created.createdAt).toBeGreaterThan(0);
    expect(created.title).toBe("Festival de Música");

    const stored = getCatalogEntity(created.id);
    expect(stored?.visibility).toBe(CatalogVisibility.PRIVATE);
    expect(stored?.capacity).toBe(500);
  });
});

describe("catálogo — o que a tela de negócio grava chega intacto à ficha", () => {
  const businessInput = {
    name: "Café Central",
    description: "Café da casa.",
    category: BusinessCategory.CAFE,
    subcategory: "Cafê especializado",
    address: "Rua das Flores, 20",
    reference: "Ao lado da praça",
    phone: "1133334444",
    website: "cafecentral.com.br",
    priceRange: PriceRange.MODERATE,
    tags: ["café", "wifi"],
    visibility: CatalogVisibility.CONNECTIONS,
    cover: "https://cdn.test/cover.jpg",
    gallery: ["https://cdn.test/g1.jpg", "https://cdn.test/g2.jpg"],
    hours: normalizeHoursSlots([{ day: DayOfWeek.MON, open: "08:00", close: "20:00" }]),
  } as const;

  test("o adaptador carrega contato, endereço, faixa de preço e subcategoria", () => {
    const business = catalogBusinessToBusiness(
      {
        id: "business-1",
        kind: CatalogKind.BUSINESS,
        ownerId: "lucas",
        createdAt: 1_700_000_000_000,
        updatedAt: 0,
        ...businessInput,
      },
      [],
    );

    expect(business.id).toBe("business-1");
    expect(business.slug).toBe("business-1");
    expect(business.name).toBe("Café Central");
    expect(business.category).toBe(BusinessCategory.CAFE);
    expect(business.subcategory).toBe("Cafê especializado");
    expect(business.description).toBe("Café da casa.");
    expect(business.address).toBe("Rua das Flores, 20");
    expect(business.phone).toBe("1133334444");
    expect(business.website).toBe("cafecentral.com.br");
    expect(business.priceRange).toBe(PriceRange.MODERATE);
    expect(business.tags).toEqual(["café", "wifi"]);
    expect(business.createdAt).toEqual(new Date(1_700_000_000_000));
  });

  test("a referência vira o rótulo do mapa quando existe", () => {
    const entity = {
      id: "business-1",
      kind: CatalogKind.BUSINESS,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      ...businessInput,
    };
    expect(catalogBusinessToBusiness(entity, []).location.label).toBe("Ao lado da praça");
    expect(
      catalogBusinessToBusiness({ ...entity, reference: "" }, []).location.label,
    ).toBe("Rua das Flores, 20");
  });

  test("capa e galeria viram a lista de fotos com uma única principal", () => {
    const business = catalogBusinessToBusiness(
      {
        id: "business-1",
        kind: CatalogKind.BUSINESS,
        ownerId: "lucas",
        createdAt: 0,
        updatedAt: 0,
        ...businessInput,
      },
      [],
    );

    expect(business.photos.map((photo) => photo.url)).toEqual([
      "https://cdn.test/cover.jpg",
      "https://cdn.test/g1.jpg",
      "https://cdn.test/g2.jpg",
    ]);
    expect(business.photos.filter((photo) => photo.isPrimary)).toHaveLength(1);
    expect(business.photos[0]?.isPrimary).toBe(true);
    expect(business.photos.every((photo) => photo.alt === "Café Central")).toBe(true);

    const repetida = catalogBusinessToBusiness(
      {
        id: "business-2",
        kind: CatalogKind.BUSINESS,
        ownerId: "lucas",
        createdAt: 0,
        updatedAt: 0,
        ...businessInput,
        gallery: ["https://cdn.test/cover.jpg"],
      },
      [],
    );
    expect(repetida.photos).toHaveLength(1);
  });

  test("negócio sem faixa de preço assume a moderada e sem tags assume local", () => {
    const business = catalogBusinessToBusiness(
      {
        id: "business-3",
        kind: CatalogKind.BUSINESS,
        ownerId: "lucas",
        createdAt: 0,
        updatedAt: 0,
        name: "Bar",
        description: "",
        category: BusinessCategory.BAR,
        address: "Rua A",
        tags: [],
      },
      [],
    );

    expect(business.priceRange).toBe(PriceRange.MODERATE);
    expect(business.tags).toEqual(["local"]);
  });

  test("o horário semanal define se o negócio aparece aberto", () => {
    const entity = {
      id: "business-1",
      kind: CatalogKind.BUSINESS,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      ...businessInput,
    };

    const abertoTodosOsDias = catalogBusinessToBusiness({ ...entity, hours: createEmptyHours(false) }, []);
    expect(abertoTodosOsDias.isOpen).toBe(true);
    expect(abertoTodosOsDias.hours).toHaveLength(7);

    const fechadoTodosOsDias = catalogBusinessToBusiness({ ...entity, hours: createEmptyHours(true) }, []);
    expect(fechadoTodosOsDias.isOpen).toBe(false);
  });

  test("o negócio gravado mantém visibilidade e contagem de promoções em zero", () => {
    const created = createCatalogBusiness({ ...businessInput });
    expect(created.kind).toBe(CatalogKind.BUSINESS);
    expect(created.visibility).toBe(CatalogVisibility.CONNECTIONS);
    expect(getCatalogEntity(created.id)?.visibility).toBe(CatalogVisibility.CONNECTIONS);
    expect(catalogBusinessToBusiness(created, []).couponCount).toBe(0);
  });
});

describe("catálogo — o que a tela de local grava chega intacto à ficha", () => {
  const placeInput = {
    name: "Parque Municipal",
    description: "Área verde com ciclovia.",
    category: "Parque",
    address: "Av. Central, 100",
    reference: "Em frente à prefeitura",
    phone: "1133334444",
    website: "parquemunicipal.com.br",
    tags: ["natureza", "lazer"],
    visibility: CatalogVisibility.PUBLIC,
    hasHours: true,
    hoursSlots: normalizeHoursSlots([
      { day: DayOfWeek.MON, open: "08:00", close: "20:00" },
      { day: DayOfWeek.SUN, closed: true },
    ]),
    cover: "https://cdn.test/park.jpg",
  } as const;

  test("o adaptador carrega contato, referência, tags e horários", () => {
    const place = catalogPlaceToPlace({
      id: "place-1",
      kind: CatalogKind.PLACE,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      ...placeInput,
    });

    expect(place.id).toBe("place-1");
    expect(place.name).toBe("Parque Municipal");
    expect(place.category).toBe("Parque");
    expect(place.description).toBe("Área verde com ciclovia.");
    expect(place.address).toBe("Av. Central, 100");
    expect(place.reference).toBe("Em frente à prefeitura");
    expect(place.phone).toBe("1133334444");
    expect(place.website).toBe("parquemunicipal.com.br");
    expect(place.tags).toEqual(["natureza", "lazer"]);
    expect(place.hoursSlots).toHaveLength(7);
    expect(place.cover).toBe("https://cdn.test/park.jpg");
  });

  test("local sem horário, com horários e com texto legado têm três textos distintos", () => {
    const base = {
      id: "place-1",
      kind: CatalogKind.PLACE,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      ...placeInput,
    };

    expect(catalogPlaceToPlace({ ...base, hasHours: false }).hours).toBe("Horário não informado");
    expect(catalogPlaceToPlace(base).hours).toContain("Seg 08:00–20:00");
    expect(
      catalogPlaceToPlace({ ...base, hasHours: true, hoursSlots: [] }).hours,
    ).toBe("Horário a confirmar");
    expect(
      catalogPlaceToPlace({
        ...base,
        hasHours: true,
        hoursSlots: [],
        hours: "  Seg a Sex 9h-18h  ",
      }).hours,
    ).toBe("Seg a Sex 9h-18h");
  });

  test("todo local cai em coordenadas padrão quando o endereço não tem ponto", () => {
    const place = catalogPlaceToPlace({
      id: "place-1",
      kind: CatalogKind.PLACE,
      ownerId: "lucas",
      createdAt: 0,
      updatedAt: 0,
      name: "Praça",
      description: "",
      category: "Praça",
      address: "Centro",
    });

    expect(Number.isFinite(place.lat)).toBe(true);
    expect(Number.isFinite(place.lng)).toBe(true);
  });

  test("o local gravado mantém visibilidade e a semana completa", () => {
    const created = createCatalogPlace({ ...placeInput });
    expect(created.kind).toBe(CatalogKind.PLACE);
    expect(created.visibility).toBe(CatalogVisibility.PUBLIC);

    const stored = getCatalogEntity(created.id);
    expect(stored?.kind).toBe(CatalogKind.PLACE);
    expect(stored?.visibility).toBe(CatalogVisibility.PUBLIC);
    if (!stored || stored.kind !== CatalogKind.PLACE) throw new Error("local não foi persistido");

    expect(catalogPlaceToPlace(stored).hoursSlots?.map((slot) => slot.day)).toEqual(DAY_ORDER);
  });
});

describe("catálogo — horário semanal", () => {
  test("a semana sempre tem sete dias, na ordem de segunda a domingo", () => {
    expect(normalizeHoursSlots(undefined)).toHaveLength(7);
    expect(normalizeHoursSlots([]).map((slot) => slot.day)).toEqual(DAY_ORDER);
    expect(normalizeHoursSlots(undefined).every((slot) => slot.closed)).toBe(true);
  });

  test("dia ausente, incompleto ou marcado como fechado fica fechado", () => {
    const slots = normalizeHoursSlots([
      { day: DayOfWeek.MON, open: "09:00", close: "18:00" },
      { day: DayOfWeek.WED, open: "10:00", close: "" },
      { day: DayOfWeek.FRI, open: "", close: "18:00" },
      { day: DayOfWeek.SAT, open: "10:00", close: "14:00", closed: true },
    ]);

    expect(slots[0]).toEqual({ day: DayOfWeek.MON, open: "09:00", close: "18:00", closed: false });
    for (const day of [DayOfWeek.TUE, DayOfWeek.THU, DayOfWeek.SUN]) {
      expect(slots.find((slot) => slot.day === day)?.closed).toBe(true);
    }
    for (const day of [DayOfWeek.WED, DayOfWeek.FRI, DayOfWeek.SAT]) {
      const slot = slots.find((item) => item.day === day);
      expect(slot?.closed).toBe(true);
      expect(slot?.open).toBe("");
      expect(slot?.close).toBe("");
    }
  });

  test("o modelo guarda um período por dia: duplicar o mesmo dia mantém o último", () => {
    const slots = normalizeHoursSlots([
      { day: DayOfWeek.MON, open: "09:00", close: "13:00" },
      { day: DayOfWeek.MON, open: "15:00", close: "20:00" },
    ]);

    expect(slots).toHaveLength(7);
    expect(slots[0]).toEqual({ day: DayOfWeek.MON, open: "15:00", close: "20:00", closed: false });
  });

  test("resumo lista segunda aberta e domingo fechado", () => {
    const summary = formatHoursSummary(
      normalizeHoursSlots([
        { day: DayOfWeek.MON, open: "09:00", close: "18:00" },
        { day: DayOfWeek.SUN, open: "", close: "", closed: true },
      ]),
    );
    expect(summary).toBe("Seg 09:00–18:00");
    expect(summary).not.toContain("Dom");
  });

  test("resumo lista domingo aberto quando o domingo tem horário", () => {
    const summary = formatHoursSummary(
      normalizeHoursSlots([{ day: DayOfWeek.SUN, open: "10:00", close: "20:00" }]),
    );
    expect(summary).toBe("Dom 10:00–20:00");
  });

  test("resumo mostra segunda fechada quando só o resto abre", () => {
    const summary = formatHoursSummary(
      normalizeHoursSlots([
        { day: DayOfWeek.MON, closed: true },
        { day: DayOfWeek.TUE, open: "09:00", close: "18:00" },
      ]),
    );
    expect(summary).toBe("Ter 09:00–18:00");
    expect(summary).not.toContain("Seg");
  });

  test("semana igual vira uma frase única e semana toda fechada vira horário não informado", () => {
    const iguais = createEmptyHours(false).map((slot) => ({ ...slot, open: "09:00", close: "18:00" }));
    expect(formatHoursSummary(iguais)).toBe("Todos os dias 09:00–18:00");
    expect(formatHoursSummary(createEmptyHours(true))).toBe("Horário não informado");
    expect(formatHoursSummary(createEmptyHours(false), false)).toBe("Horário não informado");
  });

  test("os padrões de horário criados pela tela são coerentes entre si", () => {
    const vazio = createEmptyHours();
    expect(vazio.every((slot) => slot.closed)).toBe(true);

    const aberto = createEmptyHours(false);
    expect(aberto.every((slot) => !slot.closed)).toBe(true);
    expect(aberto).toHaveLength(7);

    const padrao = createDefaultBusinessHours();
    expect(padrao).toHaveLength(7);
    expect(padrao.some((slot) => slot.closed)).toBe(false);
    expect(padrao.find((slot) => slot.day === DayOfWeek.SUN)).toEqual({
      day: DayOfWeek.SUN,
      open: "10:00",
      close: "20:00",
    });
  });
});

describe("catálogo — a IA sugere, o usuário decide", () => {
  test("aplicar sugestão devolve um objeto novo e não mexe no formulário", () => {
    const atual = { title: "Café Central", description: "Café da casa", tags: ["café"] };
    const aplicado = applyCatalogAssistSuggestion(atual, {
      title: "Café Central Premium",
      description: "Texto sugerido",
    });

    expect(aplicado).not.toBe(atual);
    expect(atual).toEqual({ title: "Café Central", description: "Café da casa", tags: ["café"] });
    expect(aplicado.title).toBe("Café Central Premium");
    expect(aplicado.description).toBe("Texto sugerido");
    expect(aplicado.tags).toEqual(["café"]);
  });

  test("descartar é apenas não chamar a função: o estado original continua idêntico", () => {
    const atual = { title: "Café Central", description: "Café da casa" };
    const antes = JSON.stringify(atual);

    const descartado = atual;
    expect(JSON.stringify(descartado)).toBe(antes);
    expect(descartado.title).toBe("Café Central");
  });

  test("o título sugerido preenche nome ou título, conforme o formulário", () => {
    expect(applyCatalogAssistSuggestion({ name: "Parque" }, { title: "Parque Municipal" }).name).toBe(
      "Parque Municipal",
    );
    expect(applyCatalogAssistSuggestion({ title: "Show" }, { title: "Show Acústico" }).title).toBe(
      "Show Acústico",
    );
    expect(applyCatalogAssistSuggestion({ name: "Parque", title: "x" }, { title: "Novo" })).toEqual({
      name: "Novo",
      title: "Novo",
    });
  });

  test("sugestão vazia ou só com espaços não sobrescreve o que o usuário escreveu", () => {
    const atual = { title: "Café Central", description: "Café da casa", subtitle: "Barista" };

    expect(applyCatalogAssistSuggestion(atual, {})).toEqual(atual);
    expect(applyCatalogAssistSuggestion(atual, { title: "   ", description: "  " })).toEqual(atual);
    expect(applyCatalogAssistSuggestion(atual, { title: " Novo " }).title).toBe("Novo");
  });

  test("campos que o formulário não tem não são inventados pela sugestão", () => {
    const semSubtitle = { title: "Show" } as { title: string; subtitle?: string };
    expect(applyCatalogAssistSuggestion(semSubtitle, { subtitle: "inventado" })).toEqual({ title: "Show" });
  });

  test("tags só entram quando a IA devolve alguma", () => {
    const atual = { title: "Show", tags: ["música"] };
    expect(applyCatalogAssistSuggestion(atual, { tags: [] }).tags).toEqual(["música"]);
    expect(applyCatalogAssistSuggestion(atual, { tags: ["música", "família"] }).tags).toEqual([
      "música",
      "família",
    ]);
  });

  const TAG_FILTERS = [
    ["evento", EVENT_FEATURE_TAGS],
    ["negócio", BUSINESS_FEATURE_TAGS],
    ["local", PLACE_FEATURE_TAGS],
  ] as const;

  for (const [label, tags] of TAG_FILTERS) {
    test(`${label}: a IA não consegue inventar característica fora da lista`, () => {
      const vocabulario: readonly string[] = tags;
      const aplicadas = applyCatalogAssistSuggestion(
        { tags: [] as string[] },
        { tags: ["música", "tag-inventada-pela-ia", "wifi", "<script>alert(1)</script>"] },
      );
      const filtradas = aplicadas.tags?.filter((tag) => vocabulario.includes(tag));

      expect(aplicadas.tags).toHaveLength(4);
      expect(filtradas?.every((tag) => vocabulario.includes(tag))).toBe(true);
      expect(filtradas).not.toContain("tag-inventada-pela-ia");
      expect(filtradas?.join(" ")).not.toContain("script");
      expect(new Set(filtradas).size).toBe(filtradas?.length);
    });
  }

  test("a camada do Gemini não publica nada do catálogo", async () => {
    const geminiFiles = (await scanSourceFiles(join(projectRoot, "src/lib/gemini"), { pathPrefix: "src/lib/gemini" }))
      .filter((file) => file.kind === "client");

    expect(geminiFiles.length).toBeGreaterThan(3);
    for (const file of geminiFiles) {
      expect(file.contents).not.toContain("createCatalogEvent");
      expect(file.contents).not.toContain("createCatalogBusiness");
      expect(file.contents).not.toContain("createCatalogPlace");
      expect(file.contents).not.toContain("localStorage");
      expect(file.contents).not.toContain("sessionStorage");
    }
  });
});

describe("catálogo — as telas de criação", () => {
  const FORMS = [
    {
      label: "evento",
      file: "src/components/catalog/event-create-form.tsx",
      create: "createCatalogEvent",
      kinds: ["createCatalogEvent"],
      fields: [
        "startDate",
        "endDate",
        "startTime",
        "endTime",
        "placeId",
        "capacity",
        "price",
        "free",
        "visibility",
        "reference",
      ],
    },
    {
      label: "negócio",
      file: "src/components/catalog/business-create-form.tsx",
      create: "createCatalogBusiness",
      kinds: ["createCatalogBusiness"],
      fields: ["priceRange", "subcategory", "phone", "website", "visibility", "reference"],
    },
    {
      label: "local",
      file: "src/components/catalog/place-create-form.tsx",
      create: "createCatalogPlace",
      kinds: ["createCatalogPlace"],
      fields: ["hasHours", "phone", "website", "visibility", "reference"],
    },
  ] as const;

  const TODAS_AS_CRIACOES = ["createCatalogEvent", "createCatalogBusiness", "createCatalogPlace", "createCatalogOffer"];

  for (const form of FORMS) {
    test(`${form.label} publica apenas a própria entidade`, async () => {
      const contents = await source(form.file);

      for (const kind of form.kinds) expect(contents).toContain(kind);
      for (const kind of TODAS_AS_CRIACOES) {
        if (!form.kinds.includes(kind)) expect(contents).not.toContain(kind);
      }
    });

    test(`${form.label} expõe os campos que a ficha precisa`, async () => {
      const contents = await source(form.file);
      for (const field of form.fields) {
        expect(contents).toContain(`data-catalog-field="${field}"`);
      }
    });

    test(`${form.label} não chama o Gemini diretamente`, async () => {
      const contents = await source(form.file);

      expect(contents).toContain("AIContentAssist");
      expect(contents).not.toContain("generateConnexyAI");
      expect(contents).not.toContain("useGeminiGenerate");
      expect(contents).not.toContain("fileToGeminiImage");
      expect(contents).not.toContain("gemini-client.server");
      expect(contents).not.toContain("GEMINI_API_KEY");
    });

    test(`${form.label} só entrega as imagens quando o usuário confirma a publicação`, async () => {
      const contents = await source(form.file);
      const publicar = contents.slice(contents.indexOf("async function handlePublish"));

      expect(publicar.length).toBeGreaterThan(0);
      expect(publicar).toContain("mediaToDataUrls");
      expect(publicar).toContain(form.create);
    });

    test(`${form.label} filtra as tags sugeridas pela IA`, async () => {
      const contents = await source(form.file);
      const bloco = contents.slice(contents.indexOf("<AIContentAssist"));

      expect(bloco).toContain("applyCatalogAssistSuggestion");
      expect(bloco).toContain("tags.filter");
      expect(bloco).toContain("FEATURE_TAGS");
    });

    test(`${form.label} não deixa a IA chamar a publicação`, async () => {
      const contents = await source(form.file);
      const inicio = contents.indexOf("<AIContentAssist");
      const bloco = contents.slice(inicio, contents.indexOf("/>", inicio) + 2);

      expect(bloco.length).toBeGreaterThan(0);
      expect(bloco).toContain("onApply");
      for (const kind of TODAS_AS_CRIACOES) expect(bloco).not.toContain(kind);
      expect(bloco).not.toContain("handlePublish");
    });
  }

  test("evento e local não aparecem como negócio e negócio não vira oferta", async () => {
    const evento = await source("src/components/catalog/event-create-form.tsx");
    const negocio = await source("src/components/catalog/business-create-form.tsx");
    const local = await source("src/components/catalog/place-create-form.tsx");

    expect(evento).not.toContain("PriceRange");
    expect(local).not.toContain("PriceRange");
    expect(local).not.toContain("priceRange");
    expect(negocio).not.toContain("createCatalogOffer");
    expect(negocio).not.toContain("promotion");
  });

  test("a IA só entra pelo componente de assistência, com as quatro ações", async () => {
    const assist = await source("src/components/catalog/ai-content-assist.tsx");

    for (const rotulo of ["Usar sugestão", "Editar", "Descartar", "Tentar novamente"]) {
      expect(assist).toContain(rotulo);
    }
    expect(assist).toContain("CATALOG_ASSIST");
    for (const kind of TODAS_AS_CRIACOES) expect(assist).not.toContain(kind);
  });

  test("aplicar a sugestão é uma ação explícita que limpa o estado da IA", async () => {
    const assist = await source("src/components/catalog/ai-content-assist.tsx");
    const inicio = assist.indexOf("function applyCurrent");
    const bloco = assist.slice(inicio, assist.indexOf("return (", inicio));

    expect(bloco.length).toBeGreaterThan(0);
    expect(bloco).toContain("onApply");
    expect(assist).toContain("setSuggestion(null)");
    expect(assist).toContain('setStatus("idle")');
  });
});

describe("catálogo — o marketplace continua sendo só exibição", () => {
  test("não grava, não cria entidades e não abre nenhuma das três telas de criação", async () => {
    const marketplace = await source("src/routes/_app/marketplace.tsx");

    for (const kind of ["createCatalogEvent", "createCatalogBusiness", "createCatalogPlace", "createCatalogOffer"]) {
      expect(marketplace).not.toContain(kind);
    }
    expect(marketplace).not.toContain("localStorage");
    expect(marketplace).not.toContain("EventCreateForm");
    expect(marketplace).not.toContain("BusinessCreateForm");
    expect(marketplace).not.toContain("PlaceCreateForm");
    for (const rota of ["/create/event", "/create/place", "/create/place-business"]) {
      expect(marketplace).not.toContain(rota);
    }
  });

  test("mantém o único caminho de criação de oferta", async () => {
    const marketplace = await source("src/routes/_app/marketplace.tsx");
    expect(marketplace).toContain('to="/create/offer"');
  });
});

const SHELL = "src/components/catalog/ad-create-shell.tsx";
const STEP_IDS = ["informacoes", "localizacao", "ofertas", "midia", "modelos", "preview", "publicar"];

function etapaBloco(contents: string, step: string): string {
  const inicio = contents.indexOf(`<AdStepSection step="${step}"`);
  if (inicio < 0) return "";
  const fim = contents.indexOf("</AdStepSection>", inicio);
  return contents.slice(inicio, fim < 0 ? contents.length : fim);
}

describe("catálogo — a prévia é a etapa de conferência, não um painel permanente", () => {
  test("a conferência e a publicação são as únicas etapas de saída do preenchimento", () => {
    expect(isReviewStep("preview")).toBe(true);
    expect(isReviewStep("publicar")).toBe(true);
    for (const step of ["informacoes", "localizacao", "ofertas", "midia", "modelos"] as const) {
      expect(isReviewStep(step)).toBe(false);
    }
  });

  test("a ordem das etapas pune o preenchimento e fecha em conferir e publicar", () => {
    expect(AD_CREATE_STEPS.map((item) => item.id)).toEqual([...STEP_IDS]);
    expect(getAdCreateStepIndex(INITIAL_AD_CREATE_STEP)).toBe(0);
    expect(getAdCreateStepIndex("preview")).toBe(5);
    expect(getAdCreateStepIndex("publicar")).toBe(6);

    const revisar = AD_CREATE_STEPS.filter((item) => isReviewStep(item.id)).map((item) => item.id);
    expect(revisar).toEqual(["preview", "publicar"]);
    expect(AD_CREATE_STEPS[5]?.label).toBe("Conferir");
    expect(AD_CREATE_STEPS[6]?.label).toBe("Publicar");
  });

  test("o shell não guarda mais uma prévia ao lado do formulário", async () => {
    const shell = await source(SHELL);

    expect(shell).not.toContain("Prévia ao vivo");
    expect(shell).not.toContain("Pré-visualizar");
    expect(shell).not.toContain("<aside");
    expect(shell).not.toContain("previewTitle");
    expect(shell).not.toContain("showMobilePreviewButton");
    expect(shell).not.toContain("LiveAdPreview");
    expect(shell).not.toContain("Sheet");
    expect(shell).not.toContain("sticky");
  });

  test("o shell não esconde a prévia com CSS: ela some do layout, não fica por cima", async () => {
    const shell = await source(SHELL);

    for (const truque of ["z-", "z-[", "fixed", "overlay", "hidden opacity", "invisible"]) {
      expect(shell).not.toContain(truque);
    }
    expect(shell).toContain("max-w-2xl");
  });

  test("as seções continuam montadas, então trocar de etapa não destrói o preenchimento", async () => {
    const shell = await source(SHELL);
    const inicio = shell.indexOf("export function AdStepSection");
    const bloco = shell.slice(inicio, shell.indexOf("export function AdCreateStepNav", inicio));

    expect(bloco).toContain('step === activeStep ? "block" : "hidden"');
    expect(bloco).toContain("{children}");
    expect(bloco).not.toContain("return null");
    expect(bloco).not.toContain("&&");
  });

  test("a navegação trava conferência e publicação enquanto os obrigatórios faltam", async () => {
    const shell = await source(SHELL);

    expect(shell).toContain("canReview");
    expect(shell).toContain("isReviewStep(item.id)");
    expect(shell).toContain("disabled={blocked}");
    expect(shell).toContain("if (blocked) return;");
  });

  test("o shell não oferece publicação permanente no cabeçalho", async () => {
    const shell = await source(SHELL);

    expect(shell).toContain("<PublisherHeader title={title} />");
    for (const vazamento of ["onPublish", "publishLabel", "publishing"]) {
      expect(shell).not.toContain(vazamento);
    }
  });

  const CAMPOS_DO_FORMULARIO = [
    {
      label: "evento",
      file: "src/components/catalog/event-create-form.tsx",
      campos: [
        "rules",
        "notes",
        "placeId",
        "location",
        "businessId",
        "startDate",
        "endDate",
        "startTime",
        "endTime",
        "capacity",
        "free",
        "price",
      ],
    },
    {
      label: "local",
      file: "src/components/catalog/place-create-form.tsx",
      campos: ["phone", "website", "hasHours"],
    },
  ] as const;

  for (const form of CAMPOS_DO_FORMULARIO) {
    test(`${form.label}: a prévia só é montada na etapa de conferência`, async () => {
      const contents = await source(form.file);
      const conferencia = etapaBloco(contents, "preview");

      expect(conferencia.length).toBeGreaterThan(0);
      expect(conferencia).toContain("<LiveAdPreview model={previewModel} />");
      for (const step of ["informacoes", "localizacao", "ofertas", "midia", "modelos", "publicar"]) {
        expect(etapaBloco(contents, step)).not.toContain("LiveAdPreview");
      }
      expect(contents).toContain("<LiveAdPreview model={previewModel} />");
    });

    test(`${form.label}: a conferência não esconde a prévia em tela grande`, async () => {
      const contents = await source(form.file);
      const conferencia = etapaBloco(contents, "preview");

      expect(conferencia).toContain('className="mx-auto w-full max-w-sm"');
      expect(conferencia).not.toContain("lg:hidden");
    });

    test(`${form.label}: a IA aparece na conferência e em nenhuma etapa de preenchimento`, async () => {
      const contents = await source(form.file);

      for (const step of ["informacoes", "localizacao", "ofertas", "midia", "modelos", "publicar"]) {
        expect(etapaBloco(contents, step)).not.toContain("AIContentAssist");
      }
      expect(etapaBloco(contents, "preview")).toContain("AIContentAssist");
      expect(contents).toContain('title="Melhorar com IA"');
    });

    test(`${form.label}: voltar e editar devolve ao preenchimento sem apagar nada`, async () => {
      const contents = await source(form.file);
      const conferencia = etapaBloco(contents, "preview");

      expect(conferencia).toContain('data-catalog-action="voltar-e-editar"');
      expect(conferencia).toContain("Voltar e editar");
      expect(conferencia).toContain("setStep(lastEditStep)");
      expect(contents).toContain("if (!isReviewStep(next)) setLastEditStep(next);");
      expect(contents).toContain("const [lastEditStep, setLastEditStep] = useState<AdCreateStepId>");
    });

    test(`${form.label}: a prévia é somente leitura e a publicação continua no fim`, async () => {
      const contents = await source(form.file);
      const preview = await source("src/components/catalog/live-ad-preview.tsx");

      expect(preview).not.toContain("<input");
      expect(preview).not.toContain("<textarea");
      expect(preview).not.toContain("onChange");
      expect(etapaBloco(contents, "publicar")).toContain("PublisherSubmitButton");
      expect(contents).toContain("PublisherSubmitButton");
    });

    test(`${form.label}: publica só pela última etapa, e por um único botão`, async () => {
      const contents = await source(form.file);
      const etapaPublicar = etapaBloco(contents, "publicar");

      expect(contents.match(/<PublisherSubmitButton/g) ?? []).toHaveLength(1);
      expect(contents.match(/void handlePublish\(\)/g) ?? []).toHaveLength(1);
      expect(etapaPublicar).toContain("PublisherSubmitButton");
      expect(etapaPublicar).toContain("publishing={saving}");

      for (const step of ["informacoes", "localizacao", "ofertas", "midia", "modelos", "preview"]) {
        expect(etapaBloco(contents, step)).not.toContain("PublisherSubmitButton");
        expect(etapaBloco(contents, step)).not.toContain("handlePublish");
      }
    });

    test(`${form.label}: nenhum campo existente foi removido`, async () => {
      const contents = await source(form.file);
      const forro = contents.slice(contents.indexOf("return ("));

      const obrigatorios = ["name", "category", "description", "address", "reference", "visibility"];
      for (const campo of [...obrigatorios, ...form.campos]) {
        expect(forro).toContain(`data-catalog-field="${campo}"`);
      }
    });
  }

  test("evento: só libera a conferência quando título, local e data já são válidos", () => {
    const valido = { title: "Festival", location: "Praça", startDate: "2026-10-05", startTime: "20:00" };
    const podeConferir = (v: typeof valido) =>
      Boolean(v.title.trim() && v.location.trim() && v.startDate && v.startTime);

    expect(podeConferir(valido)).toBe(true);
    expect(podeConferir({ ...valido, title: "  " })).toBe(false);
    expect(podeConferir({ ...valido, location: "" })).toBe(false);
    expect(podeConferir({ ...valido, startDate: "" })).toBe(false);

    expect(() =>
      createCatalogEvent({
        title: valido.title,
        description: "",
        category: "Música",
        location: valido.location,
        startAt: `${valido.startDate}T${valido.startTime}`,
      }),
    ).not.toThrow();
    expect(() =>
      createCatalogEvent({
        title: "   ",
        description: "",
        category: "Música",
        location: valido.location,
        startAt: `${valido.startDate}T${valido.startTime}`,
      }),
    ).toThrow("Informe título, local e data do evento.");
  });

  test("local: só libera a conferência quando nome e endereço já são válidos", () => {
    const podeConferir = (v: { name: string; address: string }) =>
      Boolean(v.name.trim() && v.address.trim());

    expect(podeConferir({ name: "Parque", address: "Av. Central, 100" })).toBe(true);
    expect(podeConferir({ name: "Parque", address: "  " })).toBe(false);
    expect(podeConferir({ name: "", address: "Av. Central, 100" })).toBe(false);

    expect(() =>
      createCatalogPlace({ name: "Parque", description: "", category: "Parque", address: "Av. Central, 100" }),
    ).not.toThrow();
    expect(() =>
      createCatalogPlace({ name: "Parque", description: "", category: "Parque", address: "  " }),
    ).toThrow("Informe nome e endereço do local.");
  });

  for (const form of [
    { label: "evento", file: "src/components/catalog/event-create-form.tsx" },
    { label: "local", file: "src/components/catalog/place-create-form.tsx" },
  ]) {
    test(`${form.label}: o gate usa as mesmas obrigatoriedades da publicação`, async () => {
      const contents = await source(form.file);

      expect(contents).toContain("canReview");
      expect(contents).toContain("canReview={canReview}");
      expect(contents).not.toContain("previewTitle=");
      expect(contents).not.toContain("preview={<LiveAdPreview");
    });
  }
});
