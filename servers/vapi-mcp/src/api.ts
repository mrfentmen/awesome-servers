export class VapiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "VapiError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.vapi.ai";

function headers(): Record<string, string> {
  const k = process.env.VAPI_API_KEY;
  if (!k) throw new VapiError("Set VAPI_API_KEY (free Vapi tier).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: headers() });
  } catch (e) {
    throw new VapiError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new VapiError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listAssistants(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/assistant?limit=${n}`);
}

export function getAssistant(assistantId: string): Promise<string> {
  return get(`/assistant/${encodeURIComponent(assistantId)}`);
}

export function listCalls(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/call?limit=${n}`);
}

export function getCall(callId: string): Promise<string> {
  return get(`/call/${encodeURIComponent(callId)}`);
}

