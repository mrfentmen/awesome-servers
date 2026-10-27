export class CartesiaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CartesiaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.cartesia.ai";

function key(): string {
  const k = process.env.CARTESIA_API_KEY;
  if (!k) throw new CartesiaError("Set CARTESIA_API_KEY (free Cartesia tier).");
  return k;
}

function hdrs(): Record<string, string> {
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${key()}`, "Cartesia-Version": "2026-08-14" };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: hdrs() });
  } catch (e) {
    throw new CartesiaError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new CartesiaError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  return text;
}

export function listVoices(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get("/voices").then((t) => {
    try {
      const d = JSON.parse(t) as unknown[];
      return JSON.stringify(Array.isArray(d) ? d.slice(0, n) : d, null, 2);
    } catch {
      return t.slice(0, 4000);
    }
  });
}

export function getVoice(voiceId: string): Promise<string> {
  return get(`/voices/${encodeURIComponent(voiceId)}`);
}

export function synthesizeSpeech(transcript: string, voiceId: string, modelId?: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(BASE + "/tts/bytes", {
        signal: AbortSignal.timeout(30000),
        method: "POST",
        headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${key()}`, "Cartesia-Version": "2026-08-14" },
        body: JSON.stringify({ model_id: modelId ?? "sonic-2", transcript, voice: { mode: "id", id: voiceId }, output_format: { container: "mp3", sample_rate: 44100, encoding: "mp3" } }),
      });
    } catch (e) {
      throw new CartesiaError(`Network error: ${(e as Error).message}`);
    }
    if (res.status === 401 || res.status === 403) throw new CartesiaError(`HTTP ${res.status}: invalid API key.`);
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      throw new CartesiaError(`HTTP ${res.status}: ${body}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return `Synthesized ${buf.length} bytes of MP3 audio (not embedded; paid usage).`;
  })();
}

