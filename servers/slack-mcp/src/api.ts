export class SlackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SlackError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.SLACK_BOT_TOKEN;
  if (!k) throw new SlackError("Set SLACK_BOT_TOKEN (Slack app bot token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://slack.com/api" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new SlackError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new SlackError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

async function post(method: string, body: Record<string, unknown>): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://slack.com/api/" + method, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new SlackError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new SlackError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 4000);
}

export function listChannels(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 200);
  return get(`/conversations.list?limit=${n}&types=public_channel,private_channel`);
}

export function getHistory(channel: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/conversations.history?channel=${encodeURIComponent(channel)}&limit=${n}`);
}

export function postMessage(channel: string, text: string): Promise<string> {
  return post("chat.postMessage", { channel, text });
}

