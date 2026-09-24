export class CyberarkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CyberarkError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new CyberarkError(`Set the ${name} environment variable.`)
  return v
}

async function apiBase(): Promise<string> {
  return envStrict("CYBERARK_BASE_URL").replace(/\/$/, "");
}
let cachedToken = "";
async function authHeaders(): Promise<Record<string, string>> {
  if (!cachedToken) {
    const base = await apiBase();
    const res = await fetch(`${base}/PasswordVault/API/Auth/Cyberark/Logon`, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json" },
      body: JSON.stringify({ username: envStrict("CYBERARK_USERNAME"), password: envStrict("CYBERARK_PASSWORD") }),
    });
    if (!res.ok) throw new CyberarkError(`CyberArk logon failed: HTTP ${res.status}`);
    const data = (await res.json()) as { CyberArkLogonResult?: string };
    if (!data.CyberArkLogonResult) throw new CyberarkError("CyberArk logon returned no token");
    cachedToken = data.CyberArkLogonResult;
  }
  return { Authorization: cachedToken };
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new CyberarkError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listSafes(): Promise<string> {
  const base = await apiBase();
  let url = `${base}/PasswordVault/API/Safes`;
  const data = await req(url);
  return pretty(data);
}

export async function listAccounts(safeName?: string): Promise<string> {
  const base = await apiBase();
  let url = `${base}/PasswordVault/API/Accounts`;
  const qs = new URLSearchParams();
  if (safeName !== undefined) qs.append("safeName", String(safeName));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getAccount(accountId: string): Promise<string> {
  const base = await apiBase();
  let url = `${base}/PasswordVault/API/Accounts/${encodeURIComponent(String(accountId))}`;
  const data = await req(url);
  return pretty(data);
}
