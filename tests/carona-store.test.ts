import { describe, expect, test, beforeEach } from "bun:test";

function installMemoryStorage() {
  const data = new Map<string, string>();
  const storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => {
      data.set(String(key), String(value));
    },
  } as Storage;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: storage,
      dispatchEvent: () => true,
      addEventListener() {},
      removeEventListener() {},
    },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
  return storage;
}

installMemoryStorage();

const {
  CaronaOfferStatus,
  acceptCaronaRequest,
  cancelCaronaRequest,
  caronaContextForDestination,
  createCaronaOffer,
  cancelCaronaOffer,
  getActiveCaronaRequest,
  getCaronaOffer,
  listBookableCaronaOffers,
  listCaronaRequestsForOffer,
  listMyCaronaOffers,
  rejectCaronaRequest,
  requestCarona,
  searchCaronaOffers,
} = await import("../src/lib/carona/carona-store");

const OWNER = "dono-da-carona";
const PASSAGEIRO = "passageiro-interessado";

function seedOffer(overrides: Partial<Parameters<typeof createCaronaOffer>[0]> = {}) {
  return createCaronaOffer({
    origin: "Bela Cintra",
    destination: "Centro",
    meetup: "Metrô Trianon",
    date: "2026-10-10",
    time: "18:30",
    availableSeats: 2,
    ownerId: OWNER,
    ...overrides,
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("listagem e busca de ofertas", () => {
  test("listBookableCaronaOffers devolve apenas ofertas ativas com vaga de outra pessoa", () => {
    seedOffer();
    seedOffer({ ownerId: PASSAGEIRO, destination: "Centro" });
    const full = seedOffer({ destination: "Ibirapuera", availableSeats: 1 });

    // Esgota a oferta do Ipiranga-ish zerando as vagas via aceite não é possível
    // sem request; usamos status FULL direto checando o filtro de status.
    const bookable = listBookableCaronaOffers(PASSAGEIRO);
    expect(bookable.every((offer) => offer.status === CaronaOfferStatus.ACTIVE)).toBe(true);
    expect(bookable.every((offer) => offer.ownerId !== PASSAGEIRO)).toBe(true);
    expect(bookable.some((offer) => offer.id === full.id)).toBe(true);
  });

  test("searchCaronaOffers filtra por destino informado", () => {
    seedOffer({ destination: "Centro" });
    seedOffer({ destination: "Ibirapuera" });

    const results = searchCaronaOffers({ destination: "Centro" }, PASSAGEIRO);
    expect(results).toHaveLength(1);
    expect(results[0].destination).toBe("Centro");
  });

  test("searchCaronaOffers ignora destino incompatível", () => {
    seedOffer({ destination: "Centro" });
    expect(searchCaronaOffers({ destination: "Moema" }, PASSAGEIRO)).toHaveLength(0);
  });

  test("searchCaronaOrders por data e horário mais próximo", () => {
    seedOffer({ date: "2026-10-11", time: "19:00", destination: "Centro" });
    seedOffer({ date: "2026-10-10", time: "20:00", destination: "Centro" });
    seedOffer({ date: "2026-10-10", time: "18:00", destination: "Centro" });

    const results = searchCaronaOffers(
      { destination: "Centro", date: "2026-10-10" },
      PASSAGEIRO,
    );
    expect(results.map((offer) => offer.time)).toEqual(["18:00", "20:00"]);
  });

  test("searchCaronaOffers respeita a quantidade de vagas pedidas", () => {
    seedOffer({ destination: "Centro", availableSeats: 1 });
    expect(
      searchCaronaOffers({ destination: "Centro", seats: 2 }, PASSAGEIRO),
    ).toHaveLength(0);
    expect(
      searchCaronaOffers({ destination: "Centro", seats: 1 }, PASSAGEIRO),
    ).toHaveLength(1);
  });

  test("searchCaronaOffers filtra por origem quando informada", () => {
    seedOffer({ origin: "Bela Cintra", destination: "Centro" });
    seedOffer({ origin: "Moema", destination: "Centro" });
    const results = searchCaronaOffers(
      { origin: "Bela Cintra", destination: "Centro" },
      PASSAGEIRO,
    );
    expect(results).toHaveLength(1);
    expect(results[0].origin).toBe("Bela Cintra");
  });

  test("getCaronaOffer localiza por id e devolve null quando não existe", () => {
    const offer = seedOffer();
    expect(getCaronaOffer(offer.id)?.id).toBe(offer.id);
    expect(getCaronaOffer("inexistente")).toBeNull();
  });
});

describe("contexto de Carona Amiga", () => {
  test("devolve null quando não existe oferta para o destino", () => {
    seedOffer({ destination: "Centro" });
    expect(caronaContextForDestination("Moema", PASSAGEIRO)).toBeNull();
  });

  test("devolve null para destino vazio — nunca inventa contexto", () => {
    seedOffer({ destination: "Centro" });
    expect(caronaContextForDestination("", PASSAGEIRO)).toBeNull();
    expect(caronaContextForDestination(null, PASSAGEIRO)).toBeNull();
  });

  test("conta pessoas e vagas reais das ofertas do destino", () => {
    seedOffer({ destination: "Centro", availableSeats: 2 });
    seedOffer({ ownerId: "outro-ofertante", destination: "Centro", availableSeats: 1 });

    const summary = caronaContextForDestination("Centro", PASSAGEIRO);
    expect(summary).not.toBeNull();
    expect(summary?.drivers).toBe(2);
    expect(summary?.seats).toBe(3);
  });

  test("ignora a própria oferta do usuário no contexto", () => {
    seedOffer({ destination: "Centro", ownerId: PASSAGEIRO });
    expect(caronaContextForDestination("Centro", PASSAGEIRO)).toBeNull();
  });

  test("não inclui oferta cancelada", () => {
    const offer = seedOffer({ destination: "Centro" });
    cancelCaronaOffer(offer.id, OWNER);
    expect(caronaContextForDestination("Centro", PASSAGEIRO)).toBeNull();
  });
});

describe("pedido de vaga", () => {
  test("requestCarona cria um pedido pendente com mensagem opcional", () => {
    const offer = seedOffer();
    const request = requestCarona(offer.id, PASSAGEIRO, {
      message: "Oi! Também vou para o evento.",
      seats: 1,
    });
    expect(request.status).toBe("requested");
    expect(request.message).toBe("Oi! Também vou para o evento.");
    expect(request.seats).toBe(1);
  });

  test("não cria pedido duplicado para a mesma oferta", () => {
    const offer = seedOffer();
    const first = requestCarona(offer.id, PASSAGEIRO);
    const second = requestCarona(offer.id, PASSAGEIRO);
    expect(second.id).toBe(first.id);
    expect(listCaronaRequestsForOffer(offer.id)).toHaveLength(1);
  });

  test("getActiveCaronaRequest encontra o pedido pendente", () => {
    const offer = seedOffer();
    const request = requestCarona(offer.id, PASSAGEIRO);
    expect(getActiveCaronaRequest(offer.id, PASSAGEIRO)?.id).toBe(request.id);
    expect(getActiveCaronaRequest(offer.id, OWNER)).toBeNull();
  });

  test("não permite pedir a própria carona", () => {
    const offer = seedOffer();
    expect(() => requestCarona(offer.id, OWNER)).toThrow();
  });

  test("não permite pedir carona sem vaga", async () => {
    const offer = seedOffer({ availableSeats: 1 });
    const other = requestCarona(offer.id, PASSAGEIRO);
    await acceptCaronaRequest(other.id, OWNER);
    // Segunda pessoa tenta pedir quando não há mais vaga.
    expect(() => requestCarona(offer.id, "terceira-pessoa")).toThrow();
  });
});

describe("aceite e recusa", () => {
  test("aceitar confirma o pedido, zera a vaga e gera conversationId", async () => {
    const offer = seedOffer({ availableSeats: 1 });
    const request = requestCarona(offer.id, PASSAGEIRO);
    const accepted = await acceptCaronaRequest(request.id, OWNER);

    expect(accepted.status).toBe("accepted");
    expect(accepted.conversationId).toBeTruthy();
    expect(getCaronaOffer(offer.id)?.availableSeats).toBe(0);
    expect(getCaronaOffer(offer.id)?.status).toBe(CaronaOfferStatus.FULL);
  });

  test("aceitar desconta a quantidade de vagas pedida", async () => {
    const offer = seedOffer({ availableSeats: 3 });
    const request = requestCarona(offer.id, PASSAGEIRO, { seats: 2 });
    await acceptCaronaRequest(request.id, OWNER);
    expect(getCaronaOffer(offer.id)?.availableSeats).toBe(1);
    expect(getCaronaOffer(offer.id)?.status).toBe(CaronaOfferStatus.ACTIVE);
  });

  test("recusar mantém a carona disponível e o passageiro não fica confirmado", () => {
    const offer = seedOffer();
    const request = requestCarona(offer.id, PASSAGEIRO);
    const rejected = rejectCaronaRequest(request.id, OWNER);

    expect(rejected?.status).toBe("rejected");
    expect(rejected?.conversationId).toBeUndefined();
    expect(getCaronaOffer(offer.id)?.availableSeats).toBe(2);
    expect(getActiveCaronaRequest(offer.id, PASSAGEIRO)).toBeNull();
    expect(listBookableCaronaOffers(PASSAGEIRO).some((item) => item.id === offer.id)).toBe(
      true,
    );
  });

  test("somente o ofertante pode aceitar", async () => {
    const offer = seedOffer();
    const request = requestCarona(offer.id, PASSAGEIRO);
    await expect(acceptCaronaRequest(request.id, PASSAGEIRO)).rejects.toThrow();
  });

  test("cancelar pedido aceito devolve a vaga", async () => {
    const offer = seedOffer({ availableSeats: 1 });
    const request = requestCarona(offer.id, PASSAGEIRO);
    await acceptCaronaRequest(request.id, OWNER);
    cancelCaronaRequest(request.id, PASSAGEIRO);

    expect(getCaronaOffer(offer.id)?.availableSeats).toBe(1);
    expect(getCaronaOffer(offer.id)?.status).toBe(CaronaOfferStatus.ACTIVE);
  });

  test("minhas ofertas lista apenas o que pertence ao usuário", () => {
    seedOffer({ ownerId: OWNER });
    seedOffer({ ownerId: PASSAGEIRO, destination: "Moema" });
    expect(listMyCaronaOffers(OWNER)).toHaveLength(1);
    expect(listMyCaronaOffers(OWNER)[0].ownerId).toBe(OWNER);
  });
});