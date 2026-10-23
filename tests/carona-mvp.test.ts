import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CURRENT_RIDE_ORIGIN_LABEL,
} from "../src/lib/mobility/ride-request-context";
import {
  buildCaronaSearch,
  caronaSearchHasDestination,
} from "../src/lib/carona/carona-search-params";
import {
  CARONA_HUB_ACTIONS,
  caronaContextWhenLabel,
  caronaDriversLabel,
} from "../src/lib/carona/carona-hub-actions";
import {
  caronaDateAndTimeLabel,
  caronaDateLabel,
  caronaOfferStatusLabel,
  caronaRequestStatusLabel,
  caronaSeatsLabel,
} from "../src/lib/carona/carona-format";
import {
  caronaPersonFirstName,
  caronaPersonInitials,
} from "../src/lib/carona/carona-people";

const projectRoot = join(import.meta.dir, "..");

async function source(relative: string) {
  return readFile(join(projectRoot, relative), "utf8");
}

describe("Hub da Carona Amiga", () => {
  test("as três ações apontam para rotas reais e distintas", () => {
    expect(CARONA_HUB_ACTIONS.map((action) => action.id)).toEqual([
      "encontrar",
      "oferecer",
      "minhas",
    ]);
    const routes = CARONA_HUB_ACTIONS.map((action) => action.route);
    expect(routes).toEqual(["/carona/encontrar", "/carona/nova", "/carona/minhas"]);
    expect(new Set(routes).size).toBe(routes.length);
  });

  test("a tela do Hub não abre direto o formulário de oferecer", async () => {
    const hub = await source("src/routes/_app/carona.tsx");
    expect(hub).toContain("Carona Amiga");
    expect(hub).toContain("CARONA_HUB_ACTIONS");
    for (const title of ["Encontrar carona", "Oferecer carona", "Minhas caronas"]) {
      expect(CARONA_HUB_ACTIONS.some((action) => action.title === title)).toBe(true);
    }
    // O Hub não deve publicar nem pedir vaga: é só entrada.
    expect(hub).not.toContain("createCaronaOffer");
    expect(hub).not.toContain("requestCarona");
  });

  test("o menu + preserva a entrada de Carona Amiga ao lado de Pedir corrida", async () => {
    const create = await source("src/routes/_app/create.tsx");
    expect(create).toContain("Carona Amiga");
    expect(create).toContain("Pedir corrida");
    expect(create).toContain('art: "ride"');
    // A entrada do menu abre o Hub, não o formulário de publicação.
    expect(create).toContain('route: "/carona"');
  });

  test("as rotas da Carona Amiga existem no route tree gerado", async () => {
    const tree = await source("src/routeTree.gen.ts");
    for (const fullPath of [
      "/carona",
      "/carona/nova",
      "/carona/encontrar",
      "/carona/encontradas",
      "/carona/minhas",
      "/carona/$offerId",
    ]) {
      expect(tree).toContain(`fullPath: '${fullPath}'`);
    }
  });

  test("a Carona Amiga não é adicionada ao bottom navigation", async () => {
    const shell = await source("src/routes/_app.tsx");
    const nav = /carona/i.test(shell);
    expect(nav).toBe(false);
  });
});

describe("critérios de busca na URL", () => {
  test("só envia o que existe e nunca a origem do contexto", () => {
    const search = buildCaronaSearch({
      origin: "Minha localização atual",
      destination: "Festival X",
      date: "2026-10-10",
      time: "",
      seats: null,
      contextType: "event",
      contextId: "evento-1",
      contextLabel: "Festival X",
    });
    expect(search).toEqual({
      origin: "Minha localização atual",
      destination: "Festival X",
      date: "2026-10-10",
      contextType: "event",
      contextId: "evento-1",
      contextLabel: "Festival X",
    });
    expect("time" in search).toBe(false);
    expect("seats" in search).toBe(false);
  });

  test("contexto de evento/local nunca vira origem", () => {
    const search = buildCaronaSearch({
      destination: "Festival X",
      contextType: "event",
      contextId: "evento-1",
      contextLabel: "Festival X",
    });
    expect("origin" in search).toBe(false);
  });

  test("busca só existe quando há destino informado", () => {
    expect(caronaSearchHasDestination(buildCaronaSearch({ destination: "Centro" }))).toBe(true);
    expect(caronaSearchHasDestination(buildCaronaSearch({ origin: "Bela Cintra" }))).toBe(false);
  });
});

describe("formatação da Carona Amiga", () => {
  test("rótulos de data e horário", () => {
    expect(caronaDateLabel("2026-10-05", "2026-10-05")).toBe("Hoje");
    expect(caronaDateLabel("2026-10-06", "2026-10-05")).toBe("Amanhã");
    expect(caronaDateLabel(null)).toBe("Data a combinar");
    expect(caronaDateAndTimeLabel("2026-10-05", "18:30", "2026-10-05")).toBe(
      "Hoje • 18:30",
    );
    expect(caronaDateAndTimeLabel("2026-10-05", "", "2026-10-05")).toBe("Hoje");
  });

  test("rótulos de vagas e estados", () => {
    expect(caronaSeatsLabel(1)).toBe("1 vaga");
    expect(caronaSeatsLabel(2)).toBe("2 vagas");
    expect(caronaSeatsLabel(0)).toBe("Sem vagas");
    expect(caronaRequestStatusLabel("requested")).toBe("Aguardando resposta");
    expect(caronaRequestStatusLabel("accepted")).toBe("Confirmada");
    expect(caronaRequestStatusLabel("rejected")).toBe("Recusada");
    expect(caronaOfferStatusLabel("active")).toBe("Disponível");
    expect(caronaOfferStatusLabel("full")).toBe("Esgotada");
  });

  test("contagem de pessoas usa dado real e nunca é estimada", () => {
    expect(caronaDriversLabel(0)).toContain("Ninguém");
    expect(caronaDriversLabel(1)).toBe("1 pessoa está indo para esse destino");
    expect(caronaDriversLabel(3)).toBe("3 pessoas estão indo para esse destino");
  });

  test("resumo de contexto usa horário e vagas reais", () => {
    const label = caronaContextWhenLabel(
      {
        offers: [],
        drivers: 2,
        seats: 3,
        earliestTime: "18:30",
        date: "2026-10-05",
      },
      "2026-10-05",
    );
    expect(label).toBe("Hoje • 18:30 • 3 vagas");
    expect(label).toContain("18:30");
    expect(label).toContain("3 vagas");
  });

  test("primeiro nome e iniciais para a pessoa da carona", () => {
    expect(caronaPersonFirstName(null)).toBe("Alguém");
    expect(
      caronaPersonFirstName({ id: "x", name: "Mariana Souza", photo: null, headline: null, interests: [] }),
    ).toBe("Mariana");
    expect(caronaPersonInitials("Mariana Souza")).toBe("MS");
    expect(caronaPersonInitials("Ana")).toBe("A");
  });
});

describe("tela Encontrar carona", () => {
  test("usa a localização atual como origem padrão e exige destino", async () => {
    const screen = await source("src/routes/_app/carona.encontrar.tsx");
    expect(screen).toContain("resolveRideOrigin");
    expect(screen).toContain("CURRENT_RIDE_ORIGIN_LABEL");
    expect(CURRENT_RIDE_ORIGIN_LABEL).toBe("Minha localização atual");
    expect(screen).toContain("Encontrar carona");
    expect(screen).toContain("disabled={!canSearch}");
    // Nunca usa o contexto como origem.
    expect(screen).not.toContain("search.contextLabel}\n          <input");
  });

  test("navega para os resultados com os critérios", async () => {
    const screen = await source("src/routes/_app/carona.encontrar.tsx");
    expect(screen).toContain('to: "/carona/encontradas"');
    expect(screen).toContain("buildCaronaSearch");
  });
});

describe("tela Caronas encontradas", () => {
  test("prioriza pessoa, trajeto, horário e vagas", async () => {
    const screen = await source("src/routes/_app/carona.encontradas.tsx");
    expect(screen).toContain("resolveCaronaPerson");
    expect(screen).toContain("searchCaronaOffers");
    expect(screen.indexOf("offer.origin")).toBeLessThan(screen.indexOf("offer.destination"));
    expect(screen).toContain("caronaDateAndTimeLabel");
    expect(screen).toContain("caronaSeatsLabel");
  });

  test("não cria dados fictícios quando não há resultado", async () => {
    const screen = await source("src/routes/_app/carona.encontradas.tsx");
    expect(screen).toContain("Nenhuma carona encontrada");
    expect(screen).toContain("Alterar busca");
    expect(screen).toContain('to="/carona/encontrar"');
  });

  test("o resultado navega para o detalhe já existente", async () => {
    const screen = await source("src/routes/_app/carona.encontradas.tsx");
    expect(screen).toContain('to="/carona/$offerId"');
    expect(screen).not.toContain("/carona/detalhes");
  });
});

describe("tela de detalhe da carona", () => {
  test("permite pedir vaga com mensagem opcional e não duplica pedido", async () => {
    const detail = await source("src/routes/_app/carona.$offerId.tsx");
    expect(detail).toContain("Pedir vaga");
    expect(detail).toContain("Mensagem para quem oferece a carona");
    expect(detail).toContain("getActiveCaronaRequest");
    expect(detail).toContain("requestCarona");
    expect(detail).toContain('maxLength={240}');
  });

  test("o ofertante vê pedidos e aceita ou recusa", async () => {
    const detail = await source("src/routes/_app/carona.$offerId.tsx");
    expect(detail).toContain("listCaronaRequestsForOffer");
    expect(detail).toContain("Aceitar");
    expect(detail).toContain("Recusar");
  });

  test("após aceite reutiliza a conversa existente", async () => {
    const detail = await source("src/routes/_app/carona.$offerId.tsx");
    expect(detail).toContain('to="/chat/$conversationId"');
    expect(detail).toContain("Carona confirmada");
    expect(detail).not.toContain("nuevo-sistema");
  });

  test("não expõe endereço residencial nem telefone", async () => {
    const detail = await source("src/routes/_app/carona.$offerId.tsx");
    // Só o ponto de encontro combinado aparece, nunca endereço residencial.
    expect(detail).toContain("Encontro: {offer.meetup}");
    expect(detail).not.toMatch(/telefone|\bphoneNumber\b|celular/);
  });
});

describe("contexto em evento e local", () => {
  test("a seção contextual só existe como adição, sem modal", async () => {
    const section = await source("src/components/carona/carona-context-section.tsx");
    expect(section).toContain("caronaContextForDestination");
    expect(section).toContain("Ver caronas");
    expect(section).toContain("subscribeCarona");
    expect(section).not.toMatch(/createRoot|<dialog|Dialog/);
  });

  test("evento usa o contexto sem virar origem", async () => {
    const event = await source("src/routes/_app/event.$eventId.tsx");
    expect(event).toContain("CaronaContextSection");
    expect(event).toContain('contextType="event"');
    // A corrida do evento continua existindo como antes.
    expect(event).toContain("Pedir corrida pelo Connexy");
  });

  test("local usa o contexto sem virar origem", async () => {
    const local = await source("src/routes/_app.local.$id.tsx");
    expect(local).toContain("CaronaContextSection");
    expect(local).toContain('contextType="local"');
    expect(local).toContain("Pedir corrida pelo Connexy");
  });
});

describe("alternativa contextual no fluxo de corrida", () => {
  test("o bloco aparece só quando existe contexto com oferta real", async () => {
    const block = await source(
      "src/components/mobility/ride/ride-carona-alternative.tsx",
    );
    expect(block).toContain("caronaContextForDestination");
    expect(block).toContain("if (!summary) return null;");
    expect(block).toContain("Talvez você possa ir de Carona Amiga");
    expect(block).toContain('to="/carona/encontradas"');
  });

  test("a alternativa é secundária e não altera a corrida", async () => {
    const panel = await source("src/components/mobility/ride/ride-request-panels.tsx");
    const blockIndex = panel.indexOf("{caronaAlternative}");
    const ctaIndex = panel.indexOf("Confirmar destino");
    expect(blockIndex).toBeGreaterThan(-1);
    expect(ctaIndex).toBeGreaterThan(-1);
    // O CTA principal da corrida continua sendo o último / mais destacado.
    expect(blockIndex).toBeLessThan(ctaIndex);
    expect(panel).not.toContain("patchTrip({ destination");
  });

  test("o fluxo de corrida monta a alternativa apenas com o destino já definido", async () => {
    const flow = await source("src/components/mobility/ride/ride-flow.tsx");
    expect(flow).toContain("RideCaronaAlternative");
    expect(flow).toContain("destinationLabel={destination?.label ?? null}");
  });

  test("o bloco não usa amarelo dominante", async () => {
    const block = await source(
      "src/components/mobility/ride/ride-carona-alternative.tsx",
    );
    expect(block).not.toContain("#FFC107");
    expect(block).toContain("#A855F7");
  });
});

describe("telas de mobilidade sem amarelo dominante", () => {
  test("nenhuma tela da Carona Amiga usa #FFC107", async () => {
    const files = [
      "src/routes/_app/carona.tsx",
      "src/routes/_app/carona.minhas.tsx",
      "src/routes/_app/carona.nova.tsx",
      "src/routes/_app/carona.encontrar.tsx",
      "src/routes/_app/carona.encontradas.tsx",
      "src/routes/_app/carona.$offerId.tsx",
      "src/components/carona/carona-context-section.tsx",
    ];
    for (const file of files) {
      expect(await source(file)).not.toContain("#FFC107");
    }
  });
});