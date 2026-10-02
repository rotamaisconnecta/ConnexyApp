import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DEMO_ORIGIN } from "../src/components/mobility/ride/ride-data";
import { estimateDemoFare } from "../src/lib/mobility/demo-fare";
import {
  canConfirmRideChoose,
  categoriesForVehicleTypes,
  categoriesFromRideOptions,
  listRideChooseOptions,
  pickCategoryForOptions,
  pruneSelectedRideOptionIds,
  rideChooseCategoryLabel,
  toggleRideChooseOption,
  toggleRideVehicleType,
  vehicleTypeFromCategory,
  visibleSelectedRideOptions,
} from "../src/lib/mobility/ride-choose-options";
import { CURRENT_RIDE_ORIGIN_LABEL } from "../src/lib/mobility/ride-request-context";

const projectRoot = join(import.meta.dir, "..");

async function source(relative: string) {
  return readFile(join(projectRoot, relative), "utf8");
}

const fares = {
  connexy: estimateDemoFare("connexy", 2100, 8, 0),
  conforto: estimateDemoFare("conforto", 2100, 8, 0),
  moto: estimateDemoFare("moto", 2100, 8, 0),
};
const etaMap = { connexy: 4, conforto: 6, moto: 3 };

function optionsFor(types: Array<"carro" | "moto">) {
  return listRideChooseOptions({
    origin: DEMO_ORIGIN,
    types,
    sort: "recomendado",
    fares,
    etaMap,
  });
}

describe("escolha da corrida — seleção múltipla de veículos", () => {
  test("Carro selecionado mostra somente opções de carro", () => {
    expect(categoriesForVehicleTypes(["carro"])).toEqual(["connexy", "conforto"]);
    expect(vehicleTypeFromCategory("connexy")).toBe("carro");
    expect(rideChooseCategoryLabel("conforto")).toBe("Comfort");

    const cars = optionsFor(["carro"]);
    expect(cars.map((option) => option.driver.name)).toEqual(["Marcos Oliveira", "Carla Mendes"]);
    expect(cars.every((option) => option.category !== "moto")).toBe(true);
    expect(canConfirmRideChoose(["carro"], [cars[0]])).toBe(true);
  });

  test("Moto selecionada mostra somente opções de moto", () => {
    expect(categoriesForVehicleTypes(["moto"])).toEqual(["moto"]);
    expect(vehicleTypeFromCategory("moto")).toBe("moto");

    const bikes = optionsFor(["moto"]);
    expect(bikes).toHaveLength(1);
    expect(bikes[0].category).toBe("moto");
    expect(bikes[0].driver.name).toBe("João Pereira");
    expect(canConfirmRideChoose(["moto"], [bikes[0]])).toBe(true);
  });

  test("Carro + Moto mostra as duas frotas sem criar estado Ambos", () => {
    expect(categoriesForVehicleTypes(["carro", "moto"])).toEqual(["connexy", "conforto", "moto"]);
    expect(toggleRideVehicleType(["carro"], "moto")).toEqual(["carro", "moto"]);

    const both = optionsFor(["carro", "moto"]);
    expect(both.map((option) => option.category)).toEqual(["connexy", "conforto", "moto"]);
    expect(canConfirmRideChoose(["carro", "moto"], [both[0]])).toBe(true);
  });

  test("retirar uma seleção filtra a lista e impede confirmar sem tipo", () => {
    expect(toggleRideVehicleType(["carro", "moto"], "carro")).toEqual(["moto"]);
    expect(toggleRideVehicleType(["moto"], "moto")).toEqual([]);

    const none = optionsFor([]);
    expect(none).toHaveLength(0);
    expect(canConfirmRideChoose([], [])).toBe(false);
    expect(canConfirmRideChoose(["carro"], [])).toBe(false);
  });

  test("filtros reordenam as opções existentes sem inventar ranking paralelo", () => {
    const fastest = listRideChooseOptions({
      origin: DEMO_ORIGIN,
      types: ["carro", "moto"],
      sort: "rapido",
      fares,
      etaMap,
    });
    expect(fastest[0].category).toBe("moto");

    const cheapest = listRideChooseOptions({
      origin: DEMO_ORIGIN,
      types: ["carro", "moto"],
      sort: "economico",
      fares,
      etaMap,
    });
    expect(cheapest[0].fare).toBe(fares.moto);

    const premiumCars = listRideChooseOptions({
      origin: DEMO_ORIGIN,
      types: ["carro"],
      sort: "premium",
      fares,
      etaMap,
    });
    expect(premiumCars).toHaveLength(1);
    expect(premiumCars[0].category).toBe("conforto");

    const premiumMoto = listRideChooseOptions({
      origin: DEMO_ORIGIN,
      types: ["moto"],
      sort: "premium",
      fares,
      etaMap,
    });
    expect(premiumMoto).toHaveLength(0);
    expect(pickCategoryForOptions("moto", premiumMoto)).toBeNull();
    expect(pickCategoryForOptions("moto", fastest)).toBe("moto");
  });

  test("a tela troca o seletor exclusivo por toggles no mesmo espaço", async () => {
    const screen = await source("src/components/mobility/ride/ride-choose-screen.tsx");
    const flow = await source("src/components/mobility/ride/ride-flow.tsx");
    const panels = await source("src/components/mobility/ride/ride-request-panels.tsx");
    const context = await source("src/lib/mobility/ride-request-context.ts");
    const options = await source("src/lib/mobility/ride-choose-options.ts");

    expect(screen).toContain("Escolha sua corrida");
    expect(screen).toContain("Carro");
    expect(screen).toContain("Moto");
    expect(screen).toContain("Tipos de veículo");
    expect(screen).toContain("grid-cols-2");
    expect(screen).toContain("Confirmar corrida");
    expect(screen).not.toContain("Ambos");
    expect(screen).not.toContain("André Silva");
    expect(options).not.toContain('"ambos"');
    expect(options).toContain("RideVehicleType");
    expect(panels).toContain("RideChooseScreen as CategoryPanel");
    expect(flow).toContain("onPromos");
    expect(flow).toContain('flowState === "categoria"');
    expect(flow).toContain("acceptedCategories");
    expect(flow).toContain("categoriesFromRideOptions");
    expect(screen).toContain("toggleRideChooseOption");
    expect(screen).toContain("selectedOptionIds");
    expect(screen).not.toContain("onCategory");
    expect(context).toContain("label: CURRENT_RIDE_ORIGIN_LABEL");
    expect(CURRENT_RIDE_ORIGIN_LABEL).toBe("Minha localização atual");
  });
});

describe("escolha da corrida — seleção múltipla de cards", () => {
  test("nenhuma opção selecionada impede confirmar", () => {
    const both = optionsFor(["carro", "moto"]);
    expect(canConfirmRideChoose(["carro", "moto"], [])).toBe(false);
    expect(visibleSelectedRideOptions(both, [])).toEqual([]);
    expect(categoriesFromRideOptions([])).toEqual([]);
  });

  test("uma opção selecionada habilita confirmar", () => {
    const cars = optionsFor(["carro"]);
    const selected = visibleSelectedRideOptions(cars, [cars[0].id]);
    expect(selected).toHaveLength(1);
    expect(selected[0].category).toBe("connexy");
    expect(canConfirmRideChoose(["carro"], selected)).toBe(true);
    expect(categoriesFromRideOptions(selected)).toEqual(["connexy"]);
  });

  test("duas opções selecionadas simultaneamente permanecem juntas", () => {
    const cars = optionsFor(["carro"]);
    const ids = toggleRideChooseOption(toggleRideChooseOption([], cars[0].id), cars[1].id);
    const selected = visibleSelectedRideOptions(cars, ids);
    expect(selected.map((option) => option.category)).toEqual(["connexy", "conforto"]);
    expect(canConfirmRideChoose(["carro"], selected)).toBe(true);
    expect(categoriesFromRideOptions(selected)).toEqual(["connexy", "conforto"]);
  });

  test("três opções selecionadas viram uma única lista de alternativas", () => {
    const both = optionsFor(["carro", "moto"]);
    const ids = both.reduce((current, option) => toggleRideChooseOption(current, option.id), [] as string[]);
    const selected = visibleSelectedRideOptions(both, ids);
    expect(selected).toHaveLength(3);
    expect(categoriesFromRideOptions(selected)).toEqual(["connexy", "conforto", "moto"]);
    expect(canConfirmRideChoose(["carro", "moto"], selected)).toBe(true);
  });

  test("selecionar uma opção não remove outra", () => {
    const both = optionsFor(["carro", "moto"]);
    const afterFirst = toggleRideChooseOption([], both[0].id);
    const afterSecond = toggleRideChooseOption(afterFirst, both[2].id);
    expect(afterSecond).toEqual([both[0].id, both[2].id]);
    expect(afterFirst).toEqual([both[0].id]);
  });

  test("desmarcar uma opção mantém as demais", () => {
    const both = optionsFor(["carro", "moto"]);
    const all = both.map((option) => option.id);
    const withoutComfort = toggleRideChooseOption(all, both[1].id);
    expect(withoutComfort).toEqual([both[0].id, both[2].id]);
    expect(visibleSelectedRideOptions(both, withoutComfort).map((option) => option.category)).toEqual([
      "connexy",
      "moto",
    ]);
  });

  test("Confirmar corrida desabilitado sem card e habilitado com um ou vários", () => {
    const both = optionsFor(["carro", "moto"]);
    expect(canConfirmRideChoose(["carro", "moto"], [])).toBe(false);
    expect(canConfirmRideChoose(["carro", "moto"], [both[0]])).toBe(true);
    expect(canConfirmRideChoose(["carro", "moto"], [both[0], both[1], both[2]])).toBe(true);
  });

  test("Carro + Moto permite selecionar opções das duas frotas", () => {
    const both = optionsFor(["carro", "moto"]);
    expect(both.map((option) => option.category)).toEqual(["connexy", "conforto", "moto"]);
    const selected = visibleSelectedRideOptions(both, [both[0].id, both[2].id]);
    expect(selected.map((option) => option.category)).toEqual(["connexy", "moto"]);
    expect(canConfirmRideChoose(["carro", "moto"], selected)).toBe(true);
  });

  test("filtro de veículo só remove da seleção o que deixou de estar visível", () => {
    const both = optionsFor(["carro", "moto"]);
    const cars = optionsFor(["carro"]);
    const kept = pruneSelectedRideOptionIds(cars, [both[0].id, both[2].id]);
    expect(kept).toEqual([both[0].id]);
    expect(visibleSelectedRideOptions(cars, kept)[0].category).toBe("connexy");
  });
});

