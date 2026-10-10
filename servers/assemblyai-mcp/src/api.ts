export class AssemblyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AssemblyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.assemblyai.com/v2";

function headers(): Record<string, string> {
  const k = process.env.ASSEMBLYAI_API_KEY;
  if (!k) throw new AssemblyError("Set ASSEMBLYAI_API_KEY (free AssemblyAI tier).");
  return { ...UA, Accept: "application/json", Authorization: k };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new AssemblyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new AssemblyError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listTranscripts(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/transcript?limit=${n}`);
}

export function getTranscript(transcriptId: string): Promise<string> {
  return get(`/transcript/${encodeURIComponent(transcriptId)}`);
}

export function getParagraphs(transcriptId: string): Promise<string> {
  return get(`/transcript/${encodeURIComponent(transcriptId)}/paragraphs`);
}

