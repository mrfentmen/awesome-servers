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



export function findResponse(formId: string, responseId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}/responses?included_response_ids=${encodeURIComponent(responseId)}&page_size=1`);
}

export function accountImages(): Promise<string> {
  return get("/images?page_size=20");
}

export function accountImage(imageId: string): Promise<string> {
  return get(`/images/${encodeURIComponent(imageId)}`).then((t) => t.slice(0, 4000));
}

export function createForm(title: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch("https://api.typeform.com/forms", {
        method: "POST",
        headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.TYPEFORM_TOKEN}` },
        body: JSON.stringify({ title }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new TypeformError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new TypeformError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 4000);
  })();
}

export function themes(): Promise<string> {
  return get("/themes?page_size=20");
}

export function themeDetails(themeId: string): Promise<string> {
  return get(`/themes/${encodeURIComponent(themeId)}`);
}

export function workspaces(): Promise<string> {
  return get("/workspaces?page_size=20");
}


