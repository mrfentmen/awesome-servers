export class YoutubeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "YoutubeError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.YOUTUBE_API_KEY;
  if (!k) throw new YoutubeError("Set YOUTUBE_API_KEY (free Google API key).");
  return k;
}

async function get(path: string): Promise<string> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`https://www.googleapis.com/youtube/v3${path}${sep}key=${encodeURIComponent(key())}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new YoutubeError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new YoutubeError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function search(query: string, maxResults?: string): Promise<string> {
  const n = Math.min(Number(maxResults ?? 10) || 10, 50);
  return get(`/search?part=snippet&type=video&maxResults=${n}&q=${encodeURIComponent(query)}`);
}

export function videoDetails(videoId: string): Promise<string> {
  return get(`/videos?part=snippet,statistics&id=${encodeURIComponent(videoId)}`);
}

export function channelDetails(channelId: string): Promise<string> {
  return get(`/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}`);
}

