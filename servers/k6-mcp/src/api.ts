export class K6Error extends Error {
  constructor(message: string) {
    super(message)
    this.name = "K6Error"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.K6_URL ?? "http://localhost:6565").replace(/\/$/, "");
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new K6Error(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new K6Error(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function getStatus(): Promise<string> {
  return get("/v1/status");
}

export function listMetrics(): Promise<string> {
  return get("/v1/metrics");
}

// ---- muxG tools:
import { lookup as dnsLookup } from "node:dns";
import { connect as tcpConnect } from "node:net";
import { performance } from "node:perf_hooks";

interface WaterfallStage {
  name: string;
  ms: number;
  note: string;
}

const target = (input: string): URL => {
  const raw = String(input ?? "").trim();
  if (!raw) throw new Error("Provide a URL to measure, for example https://example.com.");
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(`"${input}" is not a URL.`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https URLs can be measured.");
  return url;
};

const percentile = (sorted: number[], p: number): number => {
  if (!sorted.length) return Number.NaN;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
};

/** A request waterfall: DNS, TCP, TLS, time to first byte and full download, measured separately. */
export async function requestWaterfall(args: { url: string; timeout_ms?: number; bytes?: number }): Promise<string> {
  const url = target(args?.url);
  const timeout = Math.max(1000, Math.min(Math.round(Number(args?.timeout_ms ?? 15000) || 15000), 60000));
  const stages: WaterfallStage[] = [];
  const readBytes = Math.max(0, Math.min(Math.round(Number(args?.bytes ?? 262144) || 262144), 5_000_000));

  const dnsStart = performance.now();
  let address: string;
  let dnsNote: string;
  try {
    address = await new Promise<string>((resolve, reject) => {
      dnsLookup(url.hostname, { all: true }, (error, result) => {
        if (error) reject(error);
        else {
          const first = (result as Array<{ address: string }>)[0];
          resolve(first ? first.address : String(result));
        }
      });
    });
    dnsNote = `${url.hostname} -> ${address}`;
  } catch (e) {
    return [
      `Waterfall for ${url.toString()}`,
      `  DNS    ${(performance.now() - dnsStart).toFixed(1)} ms · failed: ${(e as Error).message}`,
      "",
      "Nothing else could be measured without an address.",
    ].join("\n");
  }
  stages.push({ name: "DNS", ms: performance.now() - dnsStart, note: dnsNote });

  const port = Number(url.port) || (url.protocol === "https:" ? 443 : 80);
  const tcpStart = performance.now();
  const tcp = await new Promise<WaterfallStage>((resolve) => {
    const socket = tcpConnect({ host: address, port });
    const started = tcpStart;
    const done = (note: string, ok: boolean): void => {
      socket.destroy();
      resolve({ name: "TCP", ms: performance.now() - started, note: ok ? `${address}:${port} connected` : note });
    };
    socket.setTimeout(timeout);
    socket.once("connect", () => done("", true));
    socket.once("timeout", () => done("timed out", false));
    socket.once("error", (e) => done(e.message, false));
  });
  stages.push(tcp);
  if (!tcp.note.startsWith(address)) return [`Waterfall for ${url.toString()}`, ...stages.map((s) => `  ${s.name.padEnd(6)} ${s.ms.toFixed(1)} ms · ${s.note}`)].join("\n");

  if (url.protocol === "https:") {
    const tlsStart = performance.now();
    try {
      await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(timeout) });
      stages.push({ name: "TLS+", ms: performance.now() - tlsStart, note: "handshake plus one HEAD round trip, so it is an upper bound" });
    } catch (e) {
      stages.push({ name: "TLS+", ms: performance.now() - tlsStart, note: `failed: ${(e as Error).message}` });
    }
  }

  const totalStart = performance.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeout),
      headers: { "User-Agent": "mrfentmen-k6-mcp/1.0", Accept: "*/*" },
    });
    let read = 0;
    const reader = res.body?.getReader();
    while (read < readBytes) {
      const chunk = await reader?.read();
      if (!chunk || chunk.done) break;
      read += chunk.value.byteLength;
    }
    const total = performance.now() - totalStart;
    const lines = [
      `Request waterfall for ${url.toString()}`,
      `  DNS    ${stages[0].ms.toFixed(1)} ms · ${stages[0].note}`,
      `  TCP    ${stages[1].ms.toFixed(1)} ms · ${stages[1].note}`,
    ];
    if (stages.length > 2) lines.push(`  TLS+   ${stages[2].ms.toFixed(1)} ms · ${stages[2].note}`);
    lines.push(`  TOTAL  ${total.toFixed(1)} ms · HTTP ${res.status} ${res.statusText} · ${res.headers.get("content-type") ?? "content type not reported"} · ${read.toLocaleString("en-US")} byte(s) read${read >= readBytes ? " (read cap reached)" : ""}`);
    lines.push(`  Server: ${res.headers.get("server") ?? "not reported"} · compression: ${res.headers.get("content-encoding") ?? "none reported"}`);
    return lines.join("\n");
  } catch (e) {
    stages.push({ name: "GET", ms: performance.now() - totalStart, note: `failed: ${(e as Error).message}` });
    return [`Request waterfall for ${url.toString()}`, ...stages.map((s) => `  ${s.name.padEnd(6)} ${s.ms.toFixed(1)} ms · ${s.note}`)].join("\n");
  }
}

/** A small load test: sample the endpoint repeatedly and report the latency distribution and status mix. */
export async function loadSample(args: { url: string; samples?: number; concurrency?: number; timeout_ms?: number }): Promise<string> {
  const url = target(args?.url);
  const samples = Math.max(2, Math.min(Math.round(Number(args?.samples ?? 20) || 20), 200));
  const concurrency = Math.max(1, Math.min(Math.round(Number(args?.concurrency ?? 5) || 5), 20));
  const timeout = Math.max(1000, Math.min(Math.round(Number(args?.timeout_ms ?? 10000) || 10000), 60000));

  const timings: number[] = [];
  const statuses = new Map<string, number>();
  const sizes: number[] = [];
  const errors: string[] = [];

  const one = async (): Promise<void> => {
    const start = performance.now();
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(timeout), headers: { "User-Agent": "mrfentmen-k6-mcp/1.0" } });
      let read = 0;
      const reader = res.body?.getReader();
      while (read < 262144) {
        const chunk = await reader?.read();
        if (!chunk || chunk.done) break;
        read += chunk.value.byteLength;
      }
      timings.push(performance.now() - start);
      sizes.push(read);
      const key = String(res.status);
      statuses.set(key, (statuses.get(key) ?? 0) + 1);
    } catch (e) {
      errors.push((e as Error).message);
    }
  };

  const started = Date.now();
  for (let batch = 0; batch < samples; batch += concurrency) {
    const size = Math.min(concurrency, samples - batch);
    await Promise.all(Array.from({ length: size }, () => one()));
  }
  const wall = Date.now() - started;

  if (!timings.length) {
    return `${samples} request(s) to ${url.toString()} all failed: ${[...new Set(errors)].slice(0, 3).join("; ")}`;
  }
  const sorted = [...timings].sort((a, b) => a - b);
  const mean = timings.reduce((sum, ms) => sum + ms, 0) / timings.length;
  const p50 = percentile(sorted, 50);
  const p90 = percentile(sorted, 90);
  const p99 = percentile(sorted, 99);
  const lines = [
    `Load sample of ${url.toString()}: ${timings.length} successful of ${samples} request(s), ${concurrency} at a time, in ${wall} ms wall clock (${(timings.length / Math.max(wall, 1) * 1000).toFixed(1)} req/s)`,
    `Latency ms: min ${sorted[0].toFixed(1)} · p50 ${p50.toFixed(1)} · p90 ${p90.toFixed(1)} · p99 ${p99.toFixed(1)} · max ${sorted[sorted.length - 1].toFixed(1)} · mean ${mean.toFixed(1)}`,
    `Jitter: ${(sorted[sorted.length - 1] - sorted[0]).toFixed(1)} ms spread between fastest and slowest sample`,
    `Statuses: ${Array.from(statuses.entries()).map(([code, count]) => `${code} (${count})`).join(", ") || "none recorded"}`,
  ];
  if (errors.length) lines.push(`Errors: ${errors.length} (${[...new Set(errors)].slice(0, 2).join("; ")})`);
  if (sizes.length) {
    const avg = Math.round(sizes.reduce((sum, n) => sum + n, 0) / sizes.length);
    lines.push(`Average body read: ${avg.toLocaleString("en-US")} bytes (capped at 262,144 per request)`);
  }
  lines.push("This is a smoke sample, not a k6 test: no thresholds, no scenarios, no ramping.");
  return lines.join("\n");
}
