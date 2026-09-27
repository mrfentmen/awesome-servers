export class CrispError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CrispError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const id = process.env.CRISP_IDENTIFIER;
  const k = process.env.CRISP_KEY;
  if (!id || !k) throw new CrispError("Set CRISP_IDENTIFIER and CRISP_KEY (Crisp plugin settings).");
  return { ...UA, Accept: "application/json", Authorization: `Basic ${Buffer.from(`${id}:${k}`).toString("base64")}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.crisp.chat/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new CrispError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CrispError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listVisitors(websiteId: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/visitors/list`);
}

export function getProfile(websiteId: string, email: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/people/profile/${encodeURIComponent(email)}`);
}

export function getConversation(websiteId: string, sessionId: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/conversations/${encodeURIComponent(sessionId)}`);
}



export function conversations(websiteId: string, page?: string): Promise<string> {
  const p = Number(page ?? 1) || 1;
  return get(`/website/${encodeURIComponent(websiteId)}/conversations/${p}`);
}

export function conversationMessages(websiteId: string, sessionId: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/conversation/${encodeURIComponent(sessionId)}/messages`);
}

export function conversationMeta(websiteId: string, sessionId: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/conversation/${encodeURIComponent(sessionId)}/meta`);
}
