export class AirtableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AirtableError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.AIRTABLE_TOKEN;
  if (!k) throw new AirtableError("Set AIRTABLE_TOKEN (Airtable PAT).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.airtable.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new AirtableError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new AirtableError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listBases(): Promise<string> {
  return get("/v0/meta/bases");
}

export function listTables(baseId: string): Promise<string> {
  return get(`/v0/meta/bases/${encodeURIComponent(baseId)}/tables`);
}

export function listRecords(baseId: string, table: string, maxRecords?: string): Promise<string> {
  const n = Math.min(Number(maxRecords ?? 10) || 10, 100);
  return get(`/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}?maxRecords=${n}`);
}

