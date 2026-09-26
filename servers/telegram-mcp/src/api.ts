export class TelegramError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TelegramError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const k = process.env.TELEGRAM_BOT_TOKEN;
  if (!k) throw new TelegramError("Set TELEGRAM_BOT_TOKEN (free @BotFather bot).");
  return `https://api.telegram.org/bot${k}`;
}

async function call(method: string, params: Record<string, string> = {}, httpMethod = "GET"): Promise<string> {
  const url = `${base()}/${method}`;
  let res: Response;
  try {
    if (httpMethod === "GET") {
      const q = new URLSearchParams(params);
      res = await fetch(`${url}?${q.toString()}`, { headers: { ...UA }, signal: AbortSignal.timeout(25000) });
    } else {
      res = await fetch(url, {
        method: "POST",
        headers: { ...UA, "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(25000),
      });
    }
  } catch (e) {
    throw new TelegramError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new TelegramError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}

export function getMe(): Promise<string> {
  return call("getMe");
}

export function sendMessage(chatId: string, text: string): Promise<string> {
  return call("sendMessage", { chat_id: chatId, text }, "POST");
}

export function getUpdates(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return call("getUpdates", { limit: String(n) });
}

