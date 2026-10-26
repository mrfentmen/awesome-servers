/**
 * Arweave gateway HTTP API client, keyless.
 * Points at any gateway via ARWEAVE_URL (default https://arweave.net).
 * Docs: https://docs.arweave.org/developers/server/http-api
 */
const BASE = (process.env.ARWEAVE_URL ?? "https://arweave.net").replace(/\/+$/, "");
export class ArweaveError extends Error {
}
async function getText(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "arweave-mcp/1.0" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new ArweaveError("Not found.");
    if (!res.ok)
        throw new ArweaveError(`Arweave error ${res.status}`);
    return await res.text();
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "arweave-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new ArweaveError("Not found.");
    if (!res.ok)
        throw new ArweaveError(`Arweave error ${res.status}`);
    return (await res.json());
}
export async function networkInfo() {
    const info = await getJson("/info");
    return [
        `Network: ${info.network ?? "arweave"}`,
        `Height: ${(info.height ?? "?").toLocaleString?.() ?? info.height ?? "?"}`,
        `Peers: ${info.peers ?? "?"}`,
        `Queue: ${info.queue_length ?? "?"}`,
    ].join("\n");
}
export async function txStatus(id) {
    const clean = id.trim();
    if (clean.length < 40)
        throw new ArweaveError(`Not a tx id: "${id}".`);
    const st = await getJson(`/tx/${clean}/status`);
    if (st.confirmed) {
        const c = (st.confirmed ?? {});
        return `${clean.slice(0, 12)}... confirmed in block ${c.block_height ?? "?"} (${c.number_of_confirmations ?? "?"} confirmations)`;
    }
    return `${clean.slice(0, 12)}... pending`;
}
export async function walletBalance(address) {
    const clean = address.trim();
    if (clean.length < 40)
        throw new ArweaveError(`Not a wallet address: "${address}".`);
    const winston = Number(await getText(`/wallet/${clean}/balance`));
    if (!isFinite(winston))
        throw new ArweaveError("Bad balance response.");
    return `${clean.slice(0, 12)}... balance: ${(winston / 1e12).toFixed(6)} AR`;
}
export async function storagePrice(bytes) {
    if (!isFinite(bytes) || bytes <= 0)
        throw new ArweaveError("Bytes must be a positive number.");
    const winston = Number(await getText(`/price/${Math.floor(bytes)}`));
    if (!isFinite(winston))
        throw new ArweaveError("Bad price response.");
    const mb = bytes / 1048576;
    return `Storing ${mb >= 1 ? `${(Math.round(mb * 100) / 100).toLocaleString()} MB` : `${bytes.toLocaleString()} bytes`} costs ~${(winston / 1e12).toFixed(6)} AR`;
}
// ---- batch-5 tools: GraphQL tag and owner search, block detail (2026-09-27) ----
const GQL_UA = "mrfentmen-arweave-mcp/1.0 (https://github.com/mrfentmen)";
const E12 = 1_000_000_000_000;
const asAr = (winston) => `${(winston / E12).toFixed(6)} AR`;
const asIso = (seconds) => typeof seconds === "number" && seconds > 0 ? new Date(seconds * 1000).toISOString() : "not confirmed";
// The gateway reports block and weave sizes as strings, so both shapes are accepted here.
const asBytes = (value) => {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes <= 0)
        return "0 B";
    const units = ["B", "kB", "MB", "GB", "TB"];
    let scaled = bytes;
    let unit = 0;
    while (scaled >= 1024 && unit < units.length - 1) {
        scaled /= 1024;
        unit += 1;
    }
    return `${scaled.toFixed(scaled >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};
async function gql(query, variables = {}) {
    const res = await fetch(`${BASE}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": GQL_UA },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(30000),
    });
    const body = (await res.json());
    if (body.errors?.length)
        throw new ArweaveError(`Arweave GraphQL rejected the query: ${body.errors.map((e) => e.message).join("; ")}`);
    if (!res.ok || !body.data)
        throw new ArweaveError(`Arweave GraphQL answered HTTP ${res.status} with no data.`);
    return body.data;
}
const tagLine = (node, limit = 4) => (node.tags ?? [])
    .filter((t) => t.name && !/^(Content-Type)$/i.test(t.name))
    .slice(0, limit)
    .map((t) => `${t.name}=${(t.value ?? "").slice(0, 40)}`)
    .join(", ");
const TRANSACTION_FIELDS = `id
  owner { address }
  tags { name value }
  block { height timestamp }
  data { size type }`;
/**
 * Finds transactions by a tag, which is how Arweave applications mark their
 * data (App-Name, Content-Type, App-Version). The gateway's GraphQL requires a
 * value with the tag name, so both are needed.
 */
export async function searchByTag(args) {
    const tag = (args.tag ?? "").trim();
    const value = (args.value ?? "").trim();
    if (!tag || !value)
        throw new ArweaveError("Both a tag name and a value are required, e.g. tag 'App-Name' with value 'ArDrive'.");
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 50);
    const data = await gql(`query($tag: String!, $value: String!, $limit: Int!) {
      transactions(first: $limit, tags: [{ name: $tag, values: [$value] }]) {
        edges { node { ${TRANSACTION_FIELDS} } }
      }
    }`, { tag, value, limit });
    const nodes = (data.transactions?.edges ?? []).map((e) => e.node ?? {}).filter((n) => n.id);
    if (!nodes.length)
        return `No transaction carries the tag ${tag}=${value}.`;
    const sizes = nodes.map((n) => Number(n.data?.size ?? 0)).filter((n) => Number.isFinite(n));
    const total = sizes.reduce((sum, n) => sum + n, 0);
    return [
        `Transactions tagged ${tag}=${value}: showing ${nodes.length}`,
        `  total data in this page: ${asBytes(total)} (largest ${asBytes(Math.max(...sizes, 0))})`,
        "",
        ...nodes.map((n, i) => {
            const details = tagLine(n);
            return [
                `${i + 1}. ${n.id}`,
                `   confirmed: ${asIso(n.block?.timestamp)}${n.block?.height ? ` in block ${n.block.height}` : " (pending)"} | ${asBytes(Number(n.data?.size ?? 0))} | owner ${n.owner?.address ?? "unknown"}`,
                details ? `   other tags: ${details}` : "",
            ].filter((line) => line !== "").join("\n");
        }),
    ].join("\n");
}
/** Everything one wallet has written, newest first, with the tags that say what each upload is. */
export async function addressTransactions(args) {
    const address = (args.address ?? "").trim();
    if (!/^[A-Za-z0-9_-]{43}$/.test(address))
        throw new ArweaveError(`"${address}" is not a 43-character Arweave address.`);
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 50);
    const data = await gql(`query($address: String!, $limit: Int!) {
      transactions(first: $limit, owners: [$address], sort: HEIGHT_DESC) {
        edges { node { ${TRANSACTION_FIELDS} } }
      }
    }`, { address, limit });
    const nodes = (data.transactions?.edges ?? []).map((e) => e.node ?? {}).filter((n) => n.id);
    if (!nodes.length)
        return `Address ${address} has no transactions the gateway indexes.`;
    const total = nodes.reduce((sum, n) => sum + Number(n.data?.size ?? 0), 0);
    return [
        `Latest transactions from ${address}: showing ${nodes.length}`,
        `  ${asBytes(total)} of data across them`,
        "",
        ...nodes.map((n, i) => {
            const details = tagLine(n);
            const type = n.data?.type ? ` (${n.data.type})` : "";
            return `${i + 1}. ${asIso(n.block?.timestamp)} — block ${n.block?.height ?? "pending"} — ${asBytes(Number(n.data?.size ?? 0))}${type}\n   ${n.id}${details ? `\n   tags: ${details}` : ""}`;
        }),
    ].join("\n");
}
/**
 * Everything one block carries, including the mining reward and the weave size,
 * which the /info summary does not expose. Height "current" reads the tip.
 */
export async function blockDetail(args) {
    const wanted = (args.height ?? "current").trim().toLowerCase();
    const path = /^\d+$/.test(wanted) ? `/block/height/${wanted}` : "/block/current";
    const block = await getJson(path);
    if (typeof block.height !== "number")
        throw new ArweaveError("Arweave returned no block for that height.");
    const age = typeof block.timestamp === "number" ? Math.floor(Date.now() / 1000 - block.timestamp) : 0;
    return [
        `Block ${block.height}${path === "/block/current" ? " (the current tip)" : ""}`,
        `  mined: ${asIso(block.timestamp)} (${age >= 0 ? `${Math.floor(age / 60)} minute(s) ago` : "clock skew"})`,
        `  transactions: ${(block.txs ?? []).length} | block size ${asBytes(block.block_size ?? 0)} | weave size ${asBytes(block.weave_size ?? 0)}`,
        `  reward: ${asAr(Number(block.reward ?? 0))} to ${block.reward_addr ?? "unknown"}`,
        `  nonce: ${block.nonce ?? "n/a"}`,
        `  difficulty: ${block.diff ?? "n/a"}`,
        `  previous block: ${block.previous_block ?? "n/a"}`,
        `  indep hash: ${block.indep_hash ?? "n/a"}`,
        "",
        (block.txs ?? []).length
            ? "Block is not empty: the transaction ids above can be read with tx_status."
            : "Empty block: nothing was mined into it but the reward, which happens on a quiet network.",
    ].join("\n");
}
