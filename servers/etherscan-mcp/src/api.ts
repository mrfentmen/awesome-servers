export class EtherscanError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EtherscanError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.ETHERSCAN_API_KEY;
  if (!k) throw new EtherscanError("Set ETHERSCAN_API_KEY (free Etherscan key).");
  return k;
}

async function call(params: Record<string, string>, chainId?: string): Promise<string> {
  const q = new URLSearchParams({ ...params, chainid: chainId ?? "1", apikey: key() });
  let res: Response;
  try {
    res = await fetch(`https://api.etherscan.io/v2/api?${q.toString()}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new EtherscanError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new EtherscanError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function getBalance(address: string, chainId?: string): Promise<string> {
  return call({ module: "account", action: "balance", address, tag: "latest" }, chainId);
}

export function getTransactions(address: string, chainId?: string): Promise<string> {
  return call({ module: "account", action: "txlist", address, startblock: "0", endblock: "99999999", page: "1", offset: "10", sort: "desc" }, chainId);
}

export function getTokenTransfers(address: string, chainId?: string): Promise<string> {
  return call({ module: "account", action: "tokentx", address, startblock: "0", endblock: "99999999", page: "1", offset: "10", sort: "desc" }, chainId);
}

