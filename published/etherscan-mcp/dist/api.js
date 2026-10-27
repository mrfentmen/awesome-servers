export class EtherscanError extends Error {
    constructor(message) {
        super(message);
        this.name = "EtherscanError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.ETHERSCAN_API_KEY;
    if (!k)
        throw new EtherscanError("Set ETHERSCAN_API_KEY (free Etherscan key).");
    return k;
}
async function call(params, chainId) {
    const q = new URLSearchParams({ ...params, chainid: chainId ?? "1", apikey: key() });
    let res;
    try {
        res = await fetch(`https://api.etherscan.io/v2/api?${q.toString()}`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new EtherscanError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new EtherscanError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function getBalance(address, chainId) {
    return call({ module: "account", action: "balance", address, tag: "latest" }, chainId);
}
export function getTransactions(address, chainId) {
    return call({ module: "account", action: "txlist", address, startblock: "0", endblock: "99999999", page: "1", offset: "10", sort: "desc" }, chainId);
}
export function getTokenTransfers(address, chainId) {
    return call({ module: "account", action: "tokentx", address, startblock: "0", endblock: "99999999", page: "1", offset: "10", sort: "desc" }, chainId);
}
export function txStatus(txhash, chainId) {
    return call({ module: "transaction", action: "getstatus", txhash }, chainId);
}
export function contractAbi(address, chainId) {
    return call({ module: "contract", action: "getabi", address }, chainId).then((t) => t.slice(0, 8000));
}
export function contractSource(address, chainId) {
    return call({ module: "contract", action: "getsourcecode", address }, chainId).then((t) => t.slice(0, 4000));
}
export function tokenBalance(contract, address, chainId) {
    return call({ module: "account", action: "tokenbalance", contractaddress: contract, address, tag: "latest" }, chainId);
}
export function gasOracle(chainId) {
    return call({ module: "gastracker", action: "gasoracle" }, chainId);
}
export function ethPrice(chainId) {
    return call({ module: "stats", action: "ethprice" }, chainId);
}
export function blockNumber(chainId) {
    return call({ module: "proxy", action: "eth_blockNumber" }, chainId);
}
// ---- muxD tools:
/** Mirrors call() but yields parsed JSON, which the derived tools need and the raw text helper cannot give. */
async function callJson(params, chainId) {
    const q = new URLSearchParams({ ...params, chainid: chainId ?? "1", apikey: key() });
    let res;
    try {
        res = await fetch(`https://api.etherscan.io/v2/api?${q.toString()}`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new EtherscanError(`Network error: ${e.message}`);
    }
    const body = await res.text();
    if (!res.ok)
        throw new EtherscanError(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    let parsed;
    try {
        parsed = JSON.parse(body);
    }
    catch {
        throw new EtherscanError("Etherscan returned a body that is not JSON.");
    }
    if (parsed?.status === "0" && typeof parsed?.result === "string") {
        throw new EtherscanError(`Etherscan rejected the request: ${parsed.result}${parsed.message && parsed.message !== "NOTOK" ? ` (${parsed.message})` : ""}`);
    }
    return parsed;
}
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
function checkAddress(a, what) {
    const v = String(a ?? "").trim();
    if (!ADDRESS_RE.test(v))
        throw new EtherscanError(`"${v}" is not a ${what}: expected 0x followed by 40 hex characters.`);
    return v;
}
const CHAIN_NAMES = {
    "1": "Ethereum mainnet", "11155111": "Sepolia testnet", "17000": "Holesky testnet",
    "137": "Polygon", "56": "BNB Smart Chain", "42161": "Arbitrum One", "10": "Optimism",
    "8453": "Base", "43114": "Avalanche C-Chain", "250": "Fantom", "100": "Gnosis",
    "324": "zkSync Era", "59144": "Linea", "534352": "Scroll", "5000": "Mantle",
    "81457": "Blast", "1868": "Soneium", "999": "HyperEVM", "1514": "Story",
};
const weiToEth = (wei) => {
    const n = Number(wei);
    return Number.isFinite(n) ? n / 1e18 : NaN;
};
const fmtEth = (n) => {
    if (!Number.isFinite(n))
        return "?";
    if (n === 0)
        return "0";
    if (n >= 1000)
        return n.toFixed(2);
    // One threshold for the whole server, so two figures printed side by side on
    // the same line always carry the same number of decimals.
    return n >= 0.01 ? n.toFixed(4) : n.toFixed(8);
};
const ts = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n * 1000 : NaN;
};
const isoOr = (v, fallback = "?") => {
    const t = ts(v);
    return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 19).replace("T", " ") + "Z" : String(fallback);
};
/** Topics are the keccak of the signature; these two are the only ones labelled rather than reported raw. */
const KNOWN_TOPICS = {
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": { name: "Transfer", args: ["from", "to", "value"] },
    "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925": { name: "Approval", args: ["owner", "spender", "value"] },
};
const topicToAddress = (t) => "0x" + t.slice(-40);
/** 18-decimal formatting for a raw wei bigint, keeping small values readable. */
const fmtEther = (wei) => {
    const neg = wei < 0n;
    const abs = neg ? -wei : wei;
    const whole = abs / 1000000000000000000n;
    const frac = (abs % 1000000000000000000n).toString().padStart(18, "0").replace(/0+$/, "");
    return `${neg ? "-" : ""}${whole.toString()}${frac ? "." + frac.slice(0, 8) : ""}`;
};
const topicToUint = (t) => {
    try {
        return BigInt("0x" + t).toString();
    }
    catch {
        return "?";
    }
};
/**
 * Value that moved through contract-to-contract calls. The existing transactions
 * tool only sees transactions where the address is the from or the to, so any
 * ETH that passed through a router, a proxy or a vault is invisible to it, which
 * is exactly why an address balance often refuses to reconcile.
 */
export async function internalTransactions(args) {
    const address = checkAddress(args.address, "contract address");
    const page = Math.min(Math.max(Math.floor(args.page ?? 1) || 1, 1), 10000);
    const offset = Math.min(Math.max(Math.floor(args.offset ?? 50) || 50, 1), 1000);
    const sort = String(args.sort ?? "desc") === "asc" ? "asc" : "desc";
    const params = { module: "account", action: "txlistinternal", address, page: String(page), offset: String(offset), sort };
    if (args.start_block !== undefined)
        params.startblock = String(Math.floor(args.start_block));
    if (args.end_block !== undefined)
        params.endblock = String(Math.floor(args.end_block));
    const data = await callJson(params, args.chain_id);
    const rows = Array.isArray(data?.result) ? data.result : [];
    const chain = CHAIN_NAMES[String(args.chain_id ?? "1")] ?? `chain ${args.chain_id ?? 1}`;
    if (!rows.length) {
        return [
            `Internal transactions for ${address} on ${chain}: none returned`,
            "",
            `Blocks ${params.startblock ?? "any"} to ${params.endblock ?? "latest"}, sorted ${sort}.`,
            "",
            "An empty result means this address was never the from or the to of an internal call in the range queried. It does not mean the address is inactive: transactions where it is the outer from, plain value transfers, and token movements are all invisible here, and they are what the transactions and token transfer tools cover. Together the two views are needed, and each is incomplete alone.",
        ].join("\n");
    }
    const parsed = rows.map((r) => ({
        block: Number(r.blockNumber ?? 0),
        time: r.timeStamp,
        hash: String(r.hash ?? ""),
        from: String(r.from ?? ""),
        to: String(r.to ?? ""),
        valueWei: String(r.value ?? "0"),
        type: String(r.type ?? ""),
        err: String(r.isError ?? "0") === "1",
        fn: String(r.function ?? r.input ?? ""),
    }));
    const shown = sort === "asc" ? parsed : parsed;
    const inSum = parsed.filter((r) => r.to.toLowerCase() === address.toLowerCase()).reduce((a, r) => a + Number(r.valueWei || 0), 0);
    const outSum = parsed.filter((r) => r.from.toLowerCase() === address.toLowerCase()).reduce((a, r) => a + Number(r.valueWei || 0), 0);
    const lines = [
        `Internal transactions for ${address} on ${chain}: ${parsed.length} record(s) on this page`,
        `Net on this page: ${fmtEth(weiToEth(outSum))} ETH out, ${fmtEth(weiToEth(inSum))} ETH in`,
        "",
        `${"block".padEnd(11)}${"direction".padEnd(10)}${"value (ETH)".padEnd(15)}${"type".padEnd(13)}to / function`,
    ];
    for (const r of shown.slice(0, 40)) {
        const dir = r.to.toLowerCase() === address.toLowerCase() ? "IN" : "OUT";
        const target = dir === "IN" ? r.from : r.to;
        const fn = r.fn && r.fn !== "()" ? ` ${r.fn.slice(0, 44)}` : "";
        lines.push(`${String(r.block).padEnd(11)}${dir.padEnd(10)}${fmtEth(weiToEth(r.valueWei)).padEnd(15)}${(r.type || "?").padEnd(13)}${target}${fn}${r.err ? "  [REVERTED]" : ""}`);
    }
    if (parsed.length > 40)
        lines.push(`...and ${parsed.length - 40} more on this page; raise offset to page through.`);
    const reverted = parsed.filter((r) => r.err).length;
    const byType = new Map();
    for (const r of parsed)
        byType.set(r.type || "?", (byType.get(r.type || "?") ?? 0) + 1);
    lines.push("", `Call types on this page: ${[...byType.entries()].map(([t, n]) => `${t} x${n}`).join(", ")}.`);
    if (reverted) {
        lines.push(`${reverted} of ${parsed.length} internal call(s) reverted. A reverted call still moved gas and still created a trace, so counting them as value transferred overstates what the address actually received.`);
    }
    lines.push("", "The totals are for this page only and are not a lifetime figure: the API pages rather than aggregates, and offset has to be walked to cover a busy address. A delegatecall or a proxy in the path makes the from and to fields describe code rather than an economic owner, so read the trace before concluding who controlled the value.");
    return lines.join("\n");
}
/** Raw event logs by address and topic, with Transfer and Approval decoded. */
export async function eventLogs(args) {
    const startBlock = Math.floor(args.from_block);
    if (!Number.isFinite(startBlock))
        throw new EtherscanError("Provide from_block: Etherscan will not scan the chain from genesis without a starting block.");
    if (startBlock < 0)
        throw new EtherscanError("from_block cannot be negative.");
    const endBlock = args.to_block !== undefined ? Math.floor(args.to_block) : "latest";
    if (args.to_block !== undefined && Number.isFinite(endBlock) && endBlock < startBlock) {
        throw new EtherscanError(`to_block ${endBlock} is before from_block ${startBlock}, so the range is empty.`);
    }
    const page = Math.min(Math.max(Math.floor(args.page ?? 1) || 1, 1), 10000);
    const offset = Math.min(Math.max(Math.floor(args.offset ?? 50) || 50, 1), 1000);
    const chain = CHAIN_NAMES[String(args.chain_id ?? "1")] ?? `chain ${args.chain_id ?? 1}`;
    const params = {
        module: "logs", action: "getLogs",
        fromBlock: String(startBlock), toBlock: String(endBlock),
        page: String(page), offset: String(offset),
    };
    if (args.address)
        params.address = checkAddress(args.address, "contract address");
    const t0 = String(args.topic0 ?? "").trim();
    if (t0) {
        if (!/^0x[0-9a-fA-F]{64}$/.test(t0))
            throw new EtherscanError(`topic0 "${t0}" is not a 32-byte topic hash (0x plus 64 hex characters). A topic is keccak256 of the event signature, not of the event name.`);
        params.topic0 = t0;
    }
    for (const [k, v] of [["topic1", args.topic1], ["topic2", args.topic2]]) {
        const val = String(v ?? "").trim();
        if (val)
            params[k] = val;
    }
    const data = await callJson(params, args.chain_id);
    const rows = Array.isArray(data?.result) ? data.result : [];
    if (!rows.length) {
        return [
            `Event logs on ${chain} for blocks ${startBlock} to ${endBlock}: none returned`,
            "",
            `Filters: ${[args.address ? `address ${args.address}` : "any address", t0 ? `topic0 ${t0}${KNOWN_TOPICS[t0] ? ` (${KNOWN_TOPICS[t0].name})` : ""}` : "any event"].join(", ")}`,
            "",
            "No matching log. Public RPC nodes usually refuse an unbounded or very wide log range, and Etherscan applies its own page limits, so a very wide block range is the usual reason for an empty page rather than an absence of events. Narrow the range and retry before concluding nothing happened.",
        ].join("\n");
    }
    const decoded = rows.map((r) => {
        const topics = Array.isArray(r.topics) ? r.topics.map(String) : [];
        const sig = KNOWN_TOPICS[(topics[0] ?? "").toLowerCase()];
        const parts = [];
        if (sig) {
            for (let i = 1; i < topics.length; i += 1) {
                const role = sig.args[i - 1] ?? `arg${i - 1}`;
                const val = role === "value" ? topicToUint(topics[i]) : role === "from" || role === "to" || role === "owner" || role === "spender" ? topicToAddress(topics[i]) : topics[i];
                parts.push(`${role}=${val}`);
            }
        }
        return {
            block: Number(r.blockNumber ?? 0),
            time: r.timeStamp,
            tx: String(r.transactionHash ?? ""),
            address: String(r.address ?? ""),
            topic0: topics[0] ?? "",
            topic1: topics[1] ?? "",
            topic2: topics[2] ?? "",
            topic3: topics[3] ?? "",
            logIndex: Number(r.logIndex ?? 0),
            sig,
            parts,
            data: String(r.data ?? "0x"),
        };
    });
    const lines = [
        `Event logs on ${chain} for blocks ${startBlock} to ${endBlock}: ${decoded.length} log(s) on this page`,
        `Filters: ${[args.address ? `address ${args.address}` : "any address", t0 ? `topic0 ${t0.slice(0, 18)}…${KNOWN_TOPICS[t0.toLowerCase()] ? ` = ${KNOWN_TOPICS[t0.toLowerCase()].name}` : " (unrecognised signature)"}` : "any event type"].join(", ")}`,
        "",
    ];
    if (!t0 && !decoded.some((d) => d.sig)) {
        lines.push("No topic0 was given, so the event type of these logs is unknown and only the raw hash is shown. Look the hash up at 4byte.directory, or pass topic0 with the keccak256 of the event signature to get it decoded.", "");
    }
    lines.push(`${"block".padEnd(11)}${"time".padEnd(21)}${"log#".padEnd(11)}${"event".padEnd(11)}decoded`);
    for (const d of decoded.slice(0, 40)) {
        const time = isoOr(d.time).slice(0, 19);
        const name = d.sig ? d.sig.name : `${d.topic0.slice(0, 12)}…?`;
        const dec = d.parts.length ? d.parts.join(" ").slice(0, 78) : (d.data !== "0x" && d.data.length > 2 ? `data ${d.data.slice(0, 40)}` : "no indexed args");
        lines.push(`${String(d.block).padEnd(11)}${time.padEnd(21)}${String(d.logIndex).padEnd(11)}${name.padEnd(11)}${dec}`);
    }
    if (decoded.length > 40)
        lines.push(`...and ${decoded.length - 40} more on this page; raise offset to page through.`);
    // Only Transfer and Approval are labelled, so the rollup is limited to those
    // and deliberately does not claim a mint or burn total it cannot evidence.
    const transfers = decoded.filter((d) => d.sig?.name === "Transfer");
    if (transfers.length) {
        const ZERO = "0x0000000000000000000000000000000000000000";
        let net = 0n;
        let mintCount = 0;
        let burnCount = 0;
        for (const d of decoded) {
            if (d.sig?.name !== "Transfer")
                continue;
            const from = topicToAddress(d.topic1);
            const to = topicToAddress(d.topic2);
            const value = BigInt(d.topic3 === "0x" ? "0" : d.topic3);
            if (from === ZERO)
                mintCount += 1;
            else if (to === ZERO)
                burnCount += 1;
            else
                net += to.toLowerCase() === (args.address ?? "").toLowerCase() ? value : -value;
        }
        const lines2 = [`${transfers.length} Transfer event(s) on this page`];
        if (args.address) {
            lines2.push(`Net movement to ${args.address} across this page: ${fmtEther(net)} ETH, counting only plain transfers between two real addresses.`);
        }
        if (mintCount)
            lines2.push(`${mintCount} mint(s) detected, from the zero address, excluded from the net figure above.`);
        if (burnCount)
            lines2.push(`${burnCount} burn(s) detected, to the zero address, also excluded.`);
        if (!args.address)
            lines2.push("No address filter was given, so no net figure is computed: summing transfers between unrelated contracts would produce a meaningless number.");
        lines.push("", ...lines2);
    }
    lines.push("", "Any event other than Transfer or Approval shows its raw topic0 rather than a guessed name, because assigning a signature to an unrecognised hash would produce a confident and wrong reading. Look the hash up at 4byte.directory.");
    lines.push("", "Indexed topics are 32 bytes each and a dynamic string or array argument is not indexed, so such values arrive in data rather than topics and are shown as raw hex. The log count is per page; offset pages through the range.");
    return lines.join("\n");
}
/** Function selectors used only where the signature is unambiguous. */
const KNOWN_SELECTORS = {
    "0x18160ddd": { name: "totalSupply()", returns: "uint256" },
    "0x313ce567": { name: "decimals()", returns: "uint256" },
    "0x95d89b41": { name: "symbol()", returns: "uint256", note: "returns a string" },
    "0x06fdde03": { name: "name()", returns: "uint256", note: "returns a string" },
    "0x70a08231": { name: "balanceOf(address)", returns: "uint256" },
    "0xdd62ed3e": { name: "allowance(address,address)", returns: "uint256" },
    "0x8da5cb5b": { name: "owner()", returns: "address" },
    "0x5c975abb": { name: "paused()", returns: "bool" },
    "0x99530b06": { name: "totalAssets()", returns: "uint256" },
    "0xb3d7f6b9": { name: "getPricePerShare()", returns: "uint256" },
};
/** Reads live contract state with eth_call, which costs nothing and sends no transaction. */
export async function contractStateRead(args) {
    const to = checkAddress(args.contract, "contract address");
    const fn = String(args.function ?? "").trim();
    const rawSel = fn.startsWith("0x") ? fn : "";
    const selector = rawSel.length >= 10 ? rawSel.slice(0, 10) : "";
    if (!selector) {
        throw new EtherscanError("Provide a 4-byte function selector as function, for example 0x70a08231 for balanceOf(address). A bare name cannot be encoded without the argument types, and guessing them would call the wrong function and return nonsense.");
    }
    if (!/^0x[0-9a-fA-F]{8,}$/.test(fn))
        throw new EtherscanError(`function must be a hex selector, e.g. 0x70a08231. Got "${fn}".`);
    const known = KNOWN_SELECTORS[selector.toLowerCase()];
    const tag = String(args.block ?? "latest").trim() || "latest";
    const data = await callJson({ module: "proxy", action: "eth_call", to, data: fn, tag }, args.chain_id);
    const raw = String(data?.result ?? "");
    const chain = CHAIN_NAMES[String(args.chain_id ?? "1")] ?? `chain ${args.chain_id ?? 1}`;
    if (!/^0x[0-9a-fA-F]*$/.test(raw)) {
        throw new EtherscanError(`eth_call returned a non-hex result: ${raw.slice(0, 120)}`);
    }
    if (raw === "0x" || raw === "") {
        return [
            `eth_call ${selector} on ${to} at ${tag} returned no data.`,
            "",
            "An empty return means the function reverted, the selector does not exist on this contract, the arguments are mis-encoded, or the contract is a proxy sitting behind an implementation that does not implement it. These are indistinguishable from the return value alone, so this is not a successful read.",
        ].join("\n");
    }
    const body = raw.slice(2);
    const lines = [
        `eth_call on ${to} (${chain}) at block ${tag}`,
        `selector: ${selector}${known ? `  =  ${known.name}` : "  (unrecognised selector)"}`,
        `args: ${fn.length > 10 ? fn.slice(10) : "none"}`,
        `raw return: ${raw.length > 130 ? `${raw.slice(0, 130)}… (${body.length / 2} bytes)` : raw}`,
        "",
    ];
    if (!known) {
        lines.push("The selector is not one of the ones decoded here, so the value is shown raw rather than interpreted. Look the selector up at 4byte.directory to find the signature, then pass the correctly typed arguments in data.");
    }
    else if (known.returns === "uint256" && body.length >= 64) {
        let value;
        try {
            value = BigInt("0x" + body.slice(0, 64));
        }
        catch {
            value = 0n;
        }
        if (known.note?.includes("string")) {
            // A dynamic string return is head, offset, length, bytes. The first word
            // is the offset, not a value, so printing it as a decoded integer would
            // report the ABI encoding detail as if it were the answer.
            // Layout for one dynamic return: word 0 is the offset, word 1 is the
            // length, and the bytes follow from word 2.
            const word = (i) => {
                try {
                    return BigInt("0x" + (body.slice(i * 64, i * 64 + 64) || "0x0"));
                }
                catch {
                    return 0n;
                }
            };
            const offset = Number(word(0));
            const len = Number(word(1));
            lines.push(`ABI head: offset ${offset}${offset === 32 ? " (expected for a single dynamic return)" : ", which is not the usual 32"}`);
            if (offset === 32 && Number.isFinite(len) && len > 0 && len < 1024) {
                const start = 128;
                try {
                    const hex = body.slice(start, start + len * 2);
                    const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []);
                    lines.push(`string: ${new TextDecoder().decode(bytes)}`);
                }
                catch {
                    lines.push("string: the bytes are not valid UTF-8, so the return is some other dynamic type rather than a string");
                }
            }
            else {
                lines.push("string: the length word is missing or implausible, so this return is not a standard dynamic string");
            }
        }
        else {
            lines.push(`decoded: ${value.toString()}`);
        }
        if (!known.note?.includes("string") && selector.toLowerCase() === "0x18160ddd") {
            const asEth = Number(value) / 1e18;
            lines.push(`as a raw integer: ${value.toString()}, which is ${Number.isFinite(asEth) ? asEth.toFixed(6) : "?"} if the unit is 18-decimal`);
        }
    }
    else if (known.returns === "bool" && body.length >= 64) {
        const v = BigInt("0x" + body.slice(0, 64));
        lines.push(`decoded: ${v === 1n ? "true" : v === 0n ? "false" : `${v} (not a canonical bool)`}`);
    }
    else if (known.returns === "address" && body.length >= 64) {
        lines.push(`decoded: ${topicToAddress(body.slice(24, 64))}`);
    }
    lines.push("", "eth_call is a read: it costs nothing, needs no gas and changes no state, but it is a simulation of current state and not proof of anything historical. To check a past value, pass that block number as block.");
    return lines.join("\n");
}
