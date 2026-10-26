#!/usr/bin/env node
// Exercise every rebuilt tool over stdio, the way a client does.
//   pass1: call with {} — proves the tool is registered and its handler runs.
//   pass2: call with real args from the live store — proves it reads data.
//
//   node scripts/verify-tools.mjs pass1 [pkg ...]
//   node scripts/verify-tools.mjs pass2 [pkg ...]

import { spawn } from "node:child_process";
import { appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PUBLISHED = "/tmp/pm/published";
const RESULTS = "/tmp/tool-results.jsonl";
const pass = process.argv[2] ?? "pass1";
const only = process.argv.slice(3);

const PKGS = [
  "noahny-mcp",
  "avianne-mcp",
  "beis-mcp",
  "ericemanuel-mcp",
  "gorjana-mcp",
  "jacquesmariemage-mcp",
  "madhappy-mcp",
  "missoma-mcp",
  "peakdesign-mcp",
  "sportyandrich-mcp",
  "balenciaga-mcp",
  "bottegaveneta-mcp",
  "burberry-mcp",
  "cartier-mcp",
  "chanel-mcp",
  "dior-mcp",
  "louisvuitton-mcp",
];

// Args pass 2 sends. @handle / @collection are filled from the store itself.
const SPEC = {
  "noahny-mcp": [
    ["season_calendar_census", { sample: "250", limit: "5" }],
    ["colour_size_matrix", { sample: "250", limit: "5" }],
  ],
  "avianne-mcp": [
    ["variant_detail", { handle: "@handle" }],
    ["catalog_by_page", { page: "1", limit: "10" }],
  ],
  "beis-mcp": [
    ["collection_products", { handle: "@collection", limit: "10" }],
    ["type_price_bands", { sample: "250" }],
  ],
  "ericemanuel-mcp": [
    ["collection_catalog", {}],
    ["variant_matrix", { handle: "@handle" }],
  ],
  "gorjana-mcp": [
    ["list_collections", { limit: "10" }],
    ["collection_products", { handle: "@collection", limit: "10" }],
  ],
  "jacquesmariemage-mcp": [
    ["lens_matrix", { sample: "250", limit: "8" }],
    ["model_families", { sample: "250", limit: "8" }],
  ],
  "madhappy-mcp": [
    ["colorway_census", { sample: "250", limit: "8" }],
    ["size_run_availability", { sample: "250", limit: "8" }],
  ],
  "missoma-mcp": [
    ["tag_taxonomy_census", { sample: "250", limit: "8" }],
    ["option_variant_matrix", { sample: "250", limit: "8" }],
  ],
  "peakdesign-mcp": [["collection_variants", { collection: "@collection", limit: "10" }]],
  "sportyandrich-mcp": [["collection_census", {}]],
  "balenciaga-mcp": [
    ["listing_variants", { handle: "@handle" }],
    ["collection_products", { handle: "@collection", limit: "5" }],
  ],
  "bottegaveneta-mcp": [
    ["listing_freshness", { sample: "250" }],
    ["product_type_ladder", { sample: "250" }],
  ],
  "burberry-mcp": [
    ["color_ladder", { sample: "250" }],
    ["availability_audit", { sample: "250" }],
  ],
  "cartier-mcp": [
    ["list_store_collections", { limit: "5" }],
    ["collection_cartier_items", { handle: "@collection", limit: "5" }],
  ],
  "chanel-mcp": [
    ["line_family_mix", { sample: "250" }],
    ["condition_type_grid", { sample: "250" }],
  ],
  "dior-mcp": [
    ["line_catalogue", { sample: "250" }],
    ["source_coverage", { sample: "250" }],
  ],
  "louisvuitton-mcp": [
    ["monogram_matrix", { limit: "8", sample: "250" }],
    ["listing_age_lookback", { sample: "250" }],
  ],
};

// Working tools in the same package that hand back a real product/collection handle.
const DISCOVERY = {
  "avianne-mcp": { handle: { tool: "list_newest", args: { limit: "2" } } },
  "beis-mcp": { collection: { tool: "list_collections", args: { limit: "2" } } },
  "ericemanuel-mcp": { handle: { tool: "search_products", args: { query: "shirt", limit: "2" } } },
  "gorjana-mcp": { collection: { tool: "list_collections", args: { limit: "2" } } },
  "peakdesign-mcp": { collection: { tool: "list_collections", args: {} } },
  "balenciaga-mcp": {
    handle: { tool: "list_newest", args: { limit: "2" } },
    collection: { tool: "list_collections", args: { limit: "2" } },
  },
  "cartier-mcp": { collection: { tool: "list_store_collections", args: { limit: "2" } } },
};

function session(pkg) {
  const dir = join(PUBLISHED, pkg);
  const child = spawn(process.execPath, [join(dir, "dist", "index.js")], {
    cwd: dir,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, MCP_LICENSE_KEY: "" },
  });
  let buf = "";
  let err = "";
  const waiters = new Map();
  const send = (o) => child.stdin.write(JSON.stringify(o) + "\n");
  const api = {
    child,
    stderr: () => err,
    call(method, params, id, timeout = 150000) {
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve({ error: { message: "timeout" } }), timeout);
        waiters.set(id, (msg) => {
          clearTimeout(timer);
          resolve(msg);
        });
        send({ jsonrpc: "2.0", method, id, params });
      });
    },
    close() {
      child.kill();
    },
  };
  child.stderr.on("data", (d) => {
    err += d.toString();
  });
  child.on("exit", () => {
    for (const [id, fn] of waiters) fn({ error: { message: "process exited: " + err.slice(-200) } });
    waiters.clear();
  });
  child.stdout.on("data", (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      let m;
      try {
        m = JSON.parse(line);
      } catch {
        continue;
      }
      const fn = waiters.get(m.id);
      if (fn) {
        waiters.delete(m.id);
        fn(m);
      }
    }
  });
  return api;
}

function coerce(schema, value) {
  const props = schema?.properties ?? {};
  if (value === "@handle" || value === "@collection") return value;
  return value;
}

function typed(schema, key, value) {
  const t = schema?.properties?.[key]?.type;
  if (value === "@handle" || value === "@collection" || value === "@source") return value;
  if (t === "number" || t === "integer") {
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  if (t === "boolean") return value === "true" || value === true;
  if (t === "array") return Array.isArray(value) ? value : [value];
  return typeof value === "number" ? String(value) : value;
}

function harvest(text) {
  const t = String(text);
  const m = t.match(/"handle"\s*:\s*"([^"]+)"/) ?? t.match(/\/collections\/([a-z0-9-]+)/i) ?? t.match(/"handle":{"?([a-z0-9-]+)/);
  if (m) return m[1];
  const alt = t.match(/collection[:=]\s*["']?([a-z0-9-]{3,})/i);
  return alt ? alt[1] : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const pkgs = only.length ? only : PKGS;

for (const pkg of pkgs) {
  console.error(`\n## ${pkg}`);
  const s = session(pkg);
  const init = await s.call(
    "initialize",
    { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "verify", version: "1" } },
    0,
    20000,
  );
  if (init.error) {
    console.error("  FAIL init:", init.error.message);
    rows.push({ pkg, tool: "(init)", pass, ok: false, kind: "init", out: init.error.message });
    s.close();
    continue;
  }
  const listed = await s.call("tools/list", {}, 1, 20000);
  const tools = Object.fromEntries(
    (listed.result?.tools ?? []).map((t) => [t.name, t.inputSchema ?? {}]),
  );

  const found = {};
  for (const [tool, rawArgs] of SPEC[pkg] ?? []) {
    const schema = tools[tool];
    if (!schema) {
      rows.push({ pkg, tool, pass, ok: false, kind: "missing-tool", out: "not in tools/list" });
      console.error(`  FAIL ${tool} — not registered`);
      continue;
    }
    const args = {};
    if (pass === "pass2") {
      for (const kind of ["@handle", "@collection"]) {
        if (!Object.values(rawArgs).includes(kind)) continue;
        const key = kind.slice(1);
        if (found[key] === undefined) {
          const d = DISCOVERY[pkg]?.[key];
          if (!d) {
            found[key] = "";
          } else {
            const r = await s.call("tools/call", { name: d.tool, arguments: d.args }, 90, 120000);
            const txt = (r.result?.content ?? []).map((c) => c.text ?? "").join("\n");
            found[key] = harvest(txt) ?? "";
            await sleep(5000);
          }
        }
      }
      const missing = Object.values(rawArgs).some((v) => (v === "@handle" || v === "@collection") && !found[v.slice(1)]);
      if (missing) {
        rows.push({ pkg, tool, pass, ok: false, kind: "no-discovery", out: "no real handle found" });
        console.error(`  MISS ${tool} — no discoverable handle`);
        continue;
      }
      for (const [k, v] of Object.entries(rawArgs)) {
        args[k] = v === "@handle" ? found.handle : v === "@collection" ? found.collection : typed(schema, k, v);
      }
    }
    const r = await s.call("tools/call", { name: tool, arguments: args }, 2, 180000);
    const text = (r.result?.content ?? []).map((c) => c.text ?? "").join("\n");
    const ok = Boolean(r.result) && !r.result?.isError;
    const kind = r.error ? "rpc-error" : r.result?.isError ? "tool-error" : "data";
    rows.push({ pkg, tool, pass, ok, kind, out: (text || r.error?.message || "").slice(0, 600) });
    console.error(`  ${ok ? "ok  " : "FAIL"} ${tool} — ${kind}: ${(text || r.error?.message || "").replace(/\s+/g, " ").slice(0, 130)}`);
    await sleep(6000);
  }
  s.close();
  await sleep(5000);
}

appendFileSync(RESULTS, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
const bad = rows.filter((r) => !r.ok);
console.log(`\n${pass}: checked ${rows.length} tools, ok ${rows.length - bad.length}, failed ${bad.length}`);
for (const r of bad) console.log(`  BAD ${r.pkg} ${r.tool} (${r.kind}) ${String(r.out).replace(/\s+/g, " ").slice(0, 200)}`);
