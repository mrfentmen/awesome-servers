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



export function chatInfo(chatId: string): Promise<string> {
  return call("getChat", { chat_id: chatId });
}

export function memberCount(chatId: string): Promise<string> {
  return call("getChatMemberCount", { chat_id: chatId });
}

export function fileInfo(fileId: string): Promise<string> {
  return call("getFile", { file_id: fileId });
}

export function sendPhoto(chatId: string, photoUrl: string, caption?: string): Promise<string> {
  const p: Record<string, string> = { chat_id: chatId, photo: photoUrl };
  if (caption) p.caption = caption;
  return call("sendPhoto", p, "POST");
}

export function myCommands(): Promise<string> {
  return call("getMyCommands");
}

export function deleteMessage(chatId: string, messageId: string): Promise<string> {
  return call("deleteMessage", { chat_id: chatId, message_id: messageId }, "POST");
}

export function editMessage(chatId: string, messageId: string, message: string): Promise<string> {
  return call("editMessageText", { chat_id: chatId, message_id: messageId, text: message }, "POST");
}
