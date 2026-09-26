export class TypeformError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TypeformError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.TYPEFORM_TOKEN;
  if (!k) throw new TypeformError("Set TYPEFORM_TOKEN (Typeform personal token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.typeform.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new TypeformError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new TypeformError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listForms(): Promise<string> {
  return get("/forms?page_size=20");
}

export function getForm(formId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}`);
}

export function listResponses(formId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}/responses?page_size=10`);
}

