export class OcrError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OcrError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.OCRSPACE_API_KEY;
  if (!k) throw new OcrError("Set OCRSPACE_API_KEY (free OCR.space key).");
  return k;
}

async function call(url: string, init: RequestInit): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(60000) });
  } catch (e) {
    throw new OcrError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new OcrError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}

export function parseImageUrl(imageUrl: string, language?: string): Promise<string> {
  const q = new URLSearchParams({ apikey: key(), url: imageUrl });
  if (language) q.set("language", language);
  return call(`https://api.ocr.space/parse/imageurl?${q.toString()}`, { headers: { ...UA } });
}

export function parseImagePost(imageUrl: string, overlay?: string): Promise<string> {
  const body = new URLSearchParams({ apikey: key(), url: imageUrl, isOverlayRequired: overlay ?? "false" });
  return call("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

