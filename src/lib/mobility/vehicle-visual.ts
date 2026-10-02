/* Imagens de veículo alinhadas ao modelo da corrida.
   A Trip continua sendo a fonte do nome; a imagem só acompanha. */

const VEHICLE_MODEL_IMAGES: Record<string, string> = {
  "honda city":
    "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=960&q=80",
  "toyota corolla":
    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=960&q=80",
  "honda cg 160":
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=960&q=80",
};

const FALLBACK_CAR_IMAGE =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=960&q=80";
const FALLBACK_MOTO_IMAGE =
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=960&q=80";

function normalizeVehicleName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function isTwoWheeler(name: string): boolean {
  return /\b(moto|cg|nmax|pcx|biz|bros|fan)\b/.test(name);
}

export function vehicleImageForName(name: string | null | undefined): string {
  const key = normalizeVehicleName(name ?? "");
  if (!key) return FALLBACK_CAR_IMAGE;
  if (VEHICLE_MODEL_IMAGES[key]) return VEHICLE_MODEL_IMAGES[key];
  for (const [model, url] of Object.entries(VEHICLE_MODEL_IMAGES)) {
    if (key.includes(model)) return url;
  }
  return isTwoWheeler(key) ? FALLBACK_MOTO_IMAGE : FALLBACK_CAR_IMAGE;
}
