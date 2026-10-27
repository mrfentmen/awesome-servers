export class NtfyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NtfyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.NTFY_BASE_URL ?? "https://ntfy.sh").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { ...UA, Accept: "application/json" };
  if (process.env.NTFY_TOKEN) h.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
  return h;
}

async function call(topic: string, method: string, body?: string, query = ""): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${base()}/${encodeURIComponent(topic)}${query}`, {
      method,
      headers: { ...headers(), ...(method === "POST" ? { Title: "MCP" } : {}) },
      body,
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new NtfyError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}

export function publish(topic: string, message: string): Promise<string> {
  return call(topic, "POST", message);
}

export function poll(topic: string): Promise<string> {
  return call(topic, "GET", undefined, "/json?poll=1");
}



export function health(): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`${base()}/v1/health`, { headers: { ...UA }, signal: AbortSignal.timeout(25000) });
    } catch (e) {
      throw new NtfyError(`Network error: ${(e as Error).message}`);
    }
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      throw new NtfyError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 1000);
  })();
}

export function account(): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`${base()}/v1/account`, { headers: headers(), signal: AbortSignal.timeout(25000) });
    } catch (e) {
      throw new NtfyError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 2000);
  })();
}

export function pollSince(topic: string, sinceId: string): Promise<string> {
  return call(topic, "GET", undefined, `/json?poll=1&since=${encodeURIComponent(sinceId)}`);
}

export function sendUrgent(topic: string, message: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
        method: "POST",
        headers: { ...headers(), Priority: "urgent", Title: "MCP urgent" },
        body: message,
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new NtfyError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 2000);
  })();
}

export function sendScheduled(topic: string, message: string, delay: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
        method: "POST",
        headers: { ...headers(), Delay: delay, Title: "MCP scheduled" },
        body: message,
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new NtfyError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 2000);
  })();
}

export function sendEmail(topic: string, message: string, email: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
        method: "POST",
        headers: { ...headers(), Email: email, Title: "MCP" },
        body: message,
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new NtfyError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 2000);
  })();
}

export function sendCall(topic: string, message: string, phone: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
        method: "POST",
        headers: { ...headers(), Call: `tel:${phone}`, Title: "MCP call" },
        body: message,
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new NtfyError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 2000);
  })();
}

export function publishTags(topic: string, message: string, tags: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
        method: "POST",
        headers: { ...headers(), Tags: tags, Title: "MCP" },
        body: message,
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new NtfyError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 2000);
  })();
}
