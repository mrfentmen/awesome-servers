export class QbitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "QbitError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.QBITTORRENT_URL;
  if (!b) throw new QbitError("Set QBITTORRENT_URL (your qBittorrent WebUI URL).");
  return b.replace(/\/$/, "");
}

async function login(): Promise<string> {
  const u = process.env.QBITTORRENT_USER ?? "admin";
  const p = process.env.QBITTORRENT_PASS;
  if (!p) throw new QbitError("Set QBITTORRENT_PASS (WebUI password).");
  let res: Response;
  try {
    res = await fetch(`${base()}/api/v2/auth/login`, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: u, password: p }).toString(),
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    throw new QbitError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) throw new QbitError(`Login failed: HTTP ${res.status}.`);
  const cookie = res.headers.get("set-cookie") ?? "";
  if (!cookie) throw new QbitError("Login failed: no session cookie (bad credentials?).");
  return cookie.split(";")[0];
}

async function get(path: string): Promise<string> {
  const sid = await login();
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json", Cookie: sid } });
  } catch (e) {
    throw new QbitError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new QbitError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listTorrents(): Promise<string> {
  return get("/api/v2/torrents/info");
}

export function getTransferInfo(): Promise<string> {
  return get("/api/v2/transfer/info");
}

export function getAppVersion(): Promise<string> {
  return get("/api/v2/app/version");
}

