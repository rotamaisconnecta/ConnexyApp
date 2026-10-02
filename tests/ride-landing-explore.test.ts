import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DEMO_ORIGIN } from "../src/components/mobility/ride/ride-data";
import {
  layoutRideExplorePins,
  listRideExplorePins,
} from "../src/lib/mobility/ride-explore-pins";

const projectRoot = join(import.meta.dir, "..");

async function source(relative: string) {
  return readFile(join(projectRoot, relative), "utf8");
}

describe("tela inicial visual de corrida", () => {
  test("reúne motoristas, negócios e eventos já existentes", () => {
    const drivers = listRideExplorePins("motoristas");
    expect(drivers.length).toBeGreaterThan(0);
    expect(drivers.every((pin) => pin.kind === "motoristas")).toBe(true);
    expect(drivers.every((pin) => Number.isFinite(pin.location.lat))).toBe(true);

    const events = listRideExplorePins("eventos");
    expect(events.some((pin) => pin.label.includes("Sunset"))).toBe(true);

    const layout = layoutRideExplorePins(DEMO_ORIGIN, drivers);
    expect(layout.user).toBeTruthy();
    expect(layout.pins.length).toBe(drivers.length);
    expect(layout.pins[0].point.x).toBeGreaterThan(0);
    expect(layout.pins[0].point.y).toBeGreaterThan(0);
  });

  test("a landing visual entra no fluxo solicitar sem criar rota nova", async () => {
    const flow = await source("src/components/mobility/ride/ride-flow.tsx");
    const landing = await source("src/components/mobility/ride/ride-landing.tsx");
    const map = await source("src/components/map-canvas.tsx");
    const rideMap = await source("src/components/mobility/ride/ride-map.tsx");

    expect(flow).toContain("RideLandingChrome");
    expect(flow).toContain("RideMap");
    expect(flow).toContain("SolicitarPanel");
    expect(landing).toContain("Para onde você vai?");
    expect(landing).toContain("Pedir Corrida");
    expect(landing).toContain("Motoristas");
    expect(landing).toContain("Negócios");
    expect(landing).toContain("Eventos");
    expect(map).toContain("#F3F0EA");
    expect(rideMap).toContain("exploreMode");
    expect(rideMap).toContain("explorePins");
    expect(rideMap).toContain("contained");
  });

  test("Definir destino reusa o itinerário e o mapa existentes", async () => {
    const panels = await source("src/components/mobility/ride/ride-request-panels.tsx");
    const itinerary = await source("src/components/mobility/ride/ride-itinerary.tsx");
    expect(panels).toContain("Definir destino");
    expect(panels).toContain("Informe onde você quer ir");
    expect(panels).toContain("Sugestões para você");
    expect(panels).toContain("Confirmar destino");
    expect(panels).toContain("RideItineraryCard");
    expect(panels).toContain("onEditOrigin");
    expect(itinerary).toContain("Adicionar parada");
    expect(itinerary).toContain("Para onde você vai?");
  });
});
