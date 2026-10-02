import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = join(import.meta.dir, "..");

async function source(relative: string) {
  return readFile(join(projectRoot, relative), "utf8");
}

function activeRidePanelSource(panel: string) {
  const start = panel.indexOf("export function ActiveRidePanel");
  const end = panel.indexOf("function ActiveRideMenuRow");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return panel.slice(start, end);
}

describe("tela visual — corrida em andamento", () => {
  test("o menu inferior começa no motorista/veículo e revela ações e carrossel no scroll", async () => {
    const panel = await source("src/components/mobility/ride/ride-live-panels.tsx");
    const flow = await source("src/components/mobility/ride/ride-flow.tsx");
    const overlays = await source("src/components/mobility/ride/ride-overlays.tsx");
    const visual = await source("src/lib/mobility/vehicle-visual.ts");
    const active = activeRidePanelSource(panel);

    expect(active).toContain("Corrida em andamento");
    expect(active).toContain("overflow-y-auto");
    expect(active).toContain("Há mais informações abaixo.");
    expect(active).toContain("Motorista parceiro");
    expect(active).toContain("vehicleImageForName(driver.vehicle.name)");
    expect(active).toContain("driver.vehicle.plate");
    expect(active).toContain("RIDE_PURPLE");
    expect(active).toContain("grid grid-cols-2");
    expect(active).toContain("driver.vehicle.color");
    expect(active).toContain("Pegar amigo");
    expect(active).toContain("Detalhes da corrida");
    expect(active).toContain("Compartilhar corrida");
    expect(active).toContain("Segurança");
    expect(active).toContain("Conecta durante a viagem");
    expect(active).toContain("listConnectPulseFeatured");
    expect(active).toContain("CONNECT_PULSE_LIMIT");
    expect(active).toContain("SwipeCarousel");
    expect(active).toContain("autoplay");
    expect(active).toContain("autoplayMs={4500}");
    expect(active).toContain("touch-pan-y");
    expect(panel).toContain("h-[3.25rem]");
    expect(panel).toContain("w-[78%]");
    expect(active).not.toContain("Fale com o motorista");
    expect(active).not.toContain("title=\"Chat\"");
    expect(active).not.toContain("Ligar");
    expect(active).not.toContain("Emergência SOS");
    expect(active).not.toContain("Rafael Souza");
    expect(active).not.toContain("Chevrolet Onix");
    expect(active).not.toContain("R$ 24,30");
    expect(active).not.toContain('"Marcos Oliveira"');
    expect(active).not.toContain('"Honda City"');
    expect(active).not.toContain('"ABC1D23"');

    expect(visual).toContain("honda city");
    expect(visual).toContain("export function vehicleImageForName");

    const flowActiveStart = flow.indexOf("<ActiveRidePanel");
    const flowActiveEnd = flow.indexOf('case "chegada"', flowActiveStart);
    expect(flowActiveStart).toBeGreaterThan(-1);
    expect(flowActiveEnd).toBeGreaterThan(flowActiveStart);
    const flowActive = flow.slice(flowActiveStart, flowActiveEnd);

    expect(flowActive).toContain("distanceMeters={distanceMeters}");
    expect(flowActive).toContain("onDetails={() => setShowDetailsOverlay(true)}");
    expect(flowActive).toContain("onShare={() => setShowShareSheet(true)}");
    expect(flowActive).toContain("onSafety={() => setShowSafetyOverlay(true)}");
    expect(flowActive).toContain("onPickFriend={handleOpenPickFriend}");
    expect(flowActive).not.toContain("onMessage=");
    expect(flowActive).not.toContain("onCall=");
    expect(flowActive).not.toContain("onEmergency=");
    expect(flow).toContain('flowState !== "emviagem"');

    expect(overlays).toContain("export function DetailsOverlay");
    expect(overlays).toContain("export function SafetyOverlay");
    expect(overlays).toContain("export function ShareSheet");
    expect(overlays).toContain("Emergência");

    const carousel = await source("src/components/system/swipe-carousel.tsx");
    expect(carousel).toContain("touch-pan-x");
    expect(carousel).toContain("overscroll-x-contain");
    expect(carousel).toContain("autoplay");
    expect(carousel).toContain("autoplayMs = 4500");
    expect(carousel).toContain('addEventListener("pointerdown"');
    expect(carousel).toContain('addEventListener("touchstart"');
  });

  test("a imagem do veículo acompanha o modelo da corrida sem hardcode no painel", async () => {
    const { vehicleImageForName } = await import("../src/lib/mobility/vehicle-visual");
    const city = vehicleImageForName("Honda City");
    const other = vehicleImageForName("Toyota Corolla");
    const moto = vehicleImageForName("Honda CG 160");
    expect(city).toContain("http");
    expect(other).not.toBe(city);
    expect(moto).toContain("http");
    expect(vehicleImageForName("Honda City")).toBe(vehicleImageForName("honda city"));
  });
});
