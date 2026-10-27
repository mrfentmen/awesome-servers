export class PublicWwwError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PublicWwwError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.PUBLICWWW_API_KEY;
  if (!k) throw new PublicWwwError("Set PUBLICWWW_API_KEY (paid PublicWWW plan).");
  return k;
}

async function search(keywords: string, exportType: string): Promise<string> {
  const url = `https://publicwww.com/websites/${encodeURIComponent(`"${keywords}"`)}/?export=${exportType}&key=${encodeURIComponent(key())}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { ...UA }, signal: AbortSignal.timeout(60000) });
  } catch (e) {
    throw new PublicWwwError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new PublicWwwError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  if (text.startsWith("Wrong API key")) throw new PublicWwwError("Wrong API key.");
  return text.slice(0, 8000);
}

export function searchSnippets(keywords: string): Promise<string> {
  return search(keywords, "urls");
}

