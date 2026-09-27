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



export function getRecord(baseId: string, table: string, recordId: string): Promise<string> {
  return get(`/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`);
}

export function searchRecords(baseId: string, table: string, formula: string, maxRecords?: string): Promise<string> {
  const n = Math.min(Number(maxRecords ?? 10) || 10, 100);
  return get(`/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=${n}`);
}

export function createRecord(baseId: string, table: string, fieldsJson: string): Promise<string> {
  let fields: unknown;
  try {
    fields = JSON.parse(fieldsJson) as unknown;
  } catch {
    throw new AirtableError("fields_json must be valid JSON.");
  }
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`, {
        method: "POST",
        headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
        body: JSON.stringify({ fields }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new AirtableError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new AirtableError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 4000);
  })();
}

export function updateRecord(baseId: string, table: string, recordId: string, fieldsJson: string): Promise<string> {
  let fields: unknown;
  try {
    fields = JSON.parse(fieldsJson) as unknown;
  } catch {
    throw new AirtableError("fields_json must be valid JSON.");
  }
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`, {
        method: "PATCH",
        headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
        body: JSON.stringify({ fields }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new AirtableError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new AirtableError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 4000);
  })();
}

export function deleteRecord(baseId: string, table: string, recordId: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`, {
        method: "DELETE",
        headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new AirtableError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new AirtableError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 2000);
  })();
}

export function listWebhooks(baseId: string): Promise<string> {
  return get(`/v0/bases/${encodeURIComponent(baseId)}/webhooks`);
}

export function recordComments(baseId: string, table: string, recordId: string): Promise<string> {
  return get(`/v0/bases/${encodeURIComponent(baseId)}/tables/${encodeURIComponent(table)}/records/${encodeURIComponent(recordId)}/comments`);
}
