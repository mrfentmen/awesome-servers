export class BeaconchainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BeaconchainError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new BeaconchainError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + envStrict("BEACONCHAIN_API_KEY") };
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
    throw new BeaconchainError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getChainState(chain?: string): Promise<string> {
  let url = `https://beaconcha.in/api/v2/ethereum/state`;
  const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chain }) });
  return pretty(data);
}

export async function getValidatorRewards(validators: string, epoch?: number, chain?: string): Promise<string> {
  let url = `https://beaconcha.in/api/v2/ethereum/validators/rewards-list`;
  const ids = validators.split(',').map((v) => Number(v.trim())).filter((v) => Number.isFinite(v));
  if (ids.length === 0) throw new BeaconchainError('Provide at least one numeric validator index.')
  const body: Record<string, unknown> = { validator: { validator_identifiers: ids }, chain, page_size: 10 };
  if (epoch !== undefined) body['epoch'] = epoch;
  const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return pretty(data);
}

export async function getLatestEpoch(): Promise<string> {
  let url = `https://beaconcha.in/api/v1/epoch/latest`;
  const data = await req(url);
  return pretty(data);
}
