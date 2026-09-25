export class FuelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FuelError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

async function xml(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://www.fueleconomy.gov/ws/rest/vehicle" + path, {
      headers: { ...UA, Accept: "application/xml" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new FuelError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new FuelError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

function items(t: string): string {
  const out: Array<{ text: string; value: string }> = [];
  const re = /<menuItem>\s*<text>([^<]*)<\/text>\s*<value>([^<]*)<\/value>\s*<\/menuItem>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null && out.length < 200) out.push({ text: m[1], value: m[2] });
  return JSON.stringify(out, null, 2);
}

export async function listMakes(year: string): Promise<string> {
  return items(await xml(`/menu/make?year=${encodeURIComponent(year)}`));
}

export async function listModels(year: string, make: string): Promise<string> {
  return items(await xml(`/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`));
}

export async function listOptions(year: string, make: string, model: string): Promise<string> {
  return items(await xml(`/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`));
}

export function getMpg(vehicleId: string): Promise<string> {
  return xml(`/ympg/shared/ympgVehicle/${encodeURIComponent(vehicleId)}`).then((t) => t.slice(0, 4000));
}

