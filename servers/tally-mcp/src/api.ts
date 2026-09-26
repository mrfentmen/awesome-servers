export class TallyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TallyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.TALLY_API_KEY;
  if (!k) throw new TallyError("Set TALLY_API_KEY (Tally settings).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.tally.so" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new TallyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new TallyError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listForms(): Promise<string> {
  return get("/forms");
}

export function getForm(formId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}`);
}

export function listSubmissions(formId: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/forms/${encodeURIComponent(formId)}/submissions?page=1&limit=${n}`);
}

