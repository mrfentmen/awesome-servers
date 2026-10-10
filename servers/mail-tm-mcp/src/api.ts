const UA = 'mrfentmen-mail-tm-mcp/1.0';

export async function domains(_args?: unknown): Promise<string> {
  const res = await fetch('https://api.mail.tm/domains', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Mail.tm returned ${res.status}`);
  const d = (await res.json()) as Array<{ domain?: string; isActive?: boolean }>;
  const list = Array.isArray(d) ? d : [];
  if (!list.length) return 'No domains returned.';
  return `Mail.tm available domains (${list.length}):\n` +
    list.map((x, i) => `${i + 1}. ${x.domain ?? '?'}${x.isActive ? ' (active)' : ''}`).join('\n');
}

// ---- muxC tools:

const MAILTM = "https://api.mail.tm"
const MAILTM_UA = "mrfentmen-mail-tm-mcp/1.0"

class MailTmError extends Error {}

/**
 * mail.tm has no API keys: an account's address and password are the credential.
 * The tool never creates or deletes anything, it only logs in and reads, so the
 * caller keeps ownership of the mailbox.
 */
async function mailTmLogin(address: string, password: string): Promise<{ jwt: string; account: Record<string, unknown> }> {
  const address_ = (address ?? "").trim()
  const password_ = (password ?? "").trim()
  if (!address_ || !password_) throw new MailTmError("Provide both address and password for the mail.tm account")
  const res = await fetch(`${MAILTM}/token`, {
    method: "POST",
    headers: { "User-Agent": MAILTM_UA, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ address: address_, password: password_ }),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new MailTmError("mail.tm rejected that address and password")
  if (!res.ok) throw new MailTmError(`mail.tm login returned ${res.status}`)
  const data = (await res.json()) as { token?: string }
  if (!data.token) throw new MailTmError("mail.tm returned no token for those credentials")
  const meRes = await fetch(`${MAILTM}/me`, {
    headers: { "User-Agent": MAILTM_UA, Accept: "application/json", Authorization: `Bearer ${data.token}` },
    signal: AbortSignal.timeout(20000),
  })
  if (!meRes.ok) throw new MailTmError(`mail.tm account lookup returned ${meRes.status}`)
  return { jwt: data.token, account: (await meRes.json()) as Record<string, unknown> }
}

function accountHeader(account: Record<string, unknown>): string {
  const used = Number(account.used ?? 0)
  const quota = Number(account.quota ?? 0)
  const bytes = `${(used / 1e6).toFixed(2)} MB of ${(quota / 1e6).toFixed(0)} MB`
  return `${String(account.address ?? "unknown address")} (id ${account.id ?? "not reported"}) | created ${String(account.createdAt ?? "not reported").slice(0, 10)} | ${bytes}`
}

