
export interface m1_LatestArgs {
  module: string;
}

const m0 = (() => {
const BASE = "https://proxy.golang.org"
const UA = "mrfentmen-go-proxy-mcp/1.0 (https://github.com/mrfentmen)"
class GoproxyError extends Error {}

function encodeModule(path: string): string {
  return path.replace(/[A-Z]/g, (ch) => `!${ch.toLowerCase()}`)
}

async function get(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new GoproxyError(`Go proxy returned HTTP ${res.status}`)
  return res
}

async function latest(args: { module?: string }): Promise<string> {
  const mod = (args.module ?? "").trim()
  if (!mod) throw new GoproxyError("Provide a module path like github.com/gin-gonic/gin")
  const d = (await (await get(`${BASE}/${encodeModule(mod)}/@latest`)).json()) as { Version?: string; Time?: string }
  return `Module ${mod}:\n  Latest: ${d?.Version ?? "n/a"}\n  Published: ${d?.Time ? d.Time.slice(0, 10) : "n/a"}`
}

async function versions(args: { module?: string; limit?: number }): Promise<string> {
  const mod = (args.module ?? "").trim()
  if (!mod) throw new GoproxyError("Provide a module path")
  const limit = Math.min(args.limit ?? 15, 50)
  const text = await (await get(`${BASE}/${encodeModule(mod)}/@v/list`)).text()
  const all = text.split("\n").filter(Boolean)
  const shown = all.slice(-limit)
  if (!shown.length) return `No versions found for ${mod}`
  return `Go module ${mod} (${all.length} versions, last ${shown.length}):\n` + shown.map((v, i) => `${i + 1}. ${v}`).join("\n")
}

return { GoproxyError, latest, versions };
})();

const m1 = (() => {
const UA = 'mrfentmen-golang-proxy-mcp/1.0';

async function latest(args: m1_LatestArgs): Promise<string> {
  const mod = (args.module ?? '').trim();
  if (!mod) return 'Provide a module path like github.com/gorilla/mux.';
  const url = `https://proxy.golang.org/${mod.split('/').map(encodeURIComponent).join('/')}/@latest`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Go proxy returned ${res.status}`);
  const d = (await res.json()) as { Version?: string; Time?: string; Origin?: { VCS?: string; URL?: string } };
  if (!d.Version) throw new Error(`Go proxy: no version for ${mod}`);
  return [
    `Go module ${mod}:`,
    `Latest version: ${d.Version}`,
    `Published: ${d.Time ?? '?'}`,
    d.Origin?.VCS ? `Source: ${d.Origin.VCS} (${d.Origin.URL ?? '?'})` : null,
  ].filter(Boolean).join('\n');
}

return { latest };
})();

export const GoproxyError = m0.GoproxyError;
export const latest = m0.latest;
export const versions = m0.versions;
export const m0_GoproxyError = m0.GoproxyError;
export const m0_versions = m0.versions;
export const m0_latest = m0.latest;
export const m1_latest = m1.latest;

  

// ---- muxC tools:

// Go's module proxy escapes uppercase letters as !lowercase in the path.

