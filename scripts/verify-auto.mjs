#!/usr/bin/env node
// Generic verifier: for each package given, call every tool that used to be a
// stub, using schema-derived arguments that are real enough to reach the API.
//
//   node scripts/verify-auto.mjs pkg1-mcp pkg2-mcp ...

import { spawn } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PUBLISHED = "/tmp/pm/published";
const RESULTS = "/tmp/tool-results-auto.jsonl";
const SPEC = JSON.parse(readFileSync("/tmp/stub-spec-all.json", "utf8"));
const pkgs = process.argv.slice(2);

const SAMPLES = {
  domain: "google.com",
  host: "google.com",
  hostname: "google.com",
  email: "user@gmail.com",
  address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  addr: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  ip: "8.8.8.8",
  symbol: "BTCUSDT",
  pair: "BTC-USD",
  ticker: "AAPL",
  coin: "bitcoin",
  coin_id: "bitcoin",
  id: "bitcoin",
  asset: "bitcoin",
  currency: "USD",
  query: "openai",
  q: "openai",
  search: "openai",
  term: "openai",
  org: "openai",
  organization: "openai",
  board: "openai",
  company: "openai",
  username: "torvalds",
  user: "torvalds",
  login: "torvalds",
  password: "Password123",
  url: "https://example.com",
  link: "https://example.com",
  path: "/",
  repo: "facebook/react",
  repository: "facebook/react",
  project: "facebook/react",
  owner: "facebook",
  tag: "news",
  category: "software",
  city: "Berlin",
  country: "US",
  chain: "ethereum",
  network: "ethereum",
  subnet: "ethereum",
  name: "example",
  slug: "example",
  handle: "example",
  cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
  hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  text: "hello",
  message: "hello",
  station: "25544",
  registration: "N12345",
  flight: "BA123",
  stop: "1",
  route: "1",
  format: "json",
  type: "all",
  interval: "1d",
  period: "1d",
  limit: "5",
  page: "1",
  days: "7",
  hours: "24",
  year: "2024",
  quote: "USDT",
  quote_asset: "USDT",
  base: "BTC",
  base_asset: "BTC",
  window: "30",
  sample: "200",
  size: "10",
  top: "5",
  count: "5",
  depth: "2",
  max: "10",
  min: "1",
  sort: "desc",
  order: "desc",
  direction: "desc",
};

// Tools whose arguments need a value no generic heuristic can guess.
const OVERRIDES = {
  "cgtrader-mcp:category_tree": { parent_id: 1 },
  "cocktaildb-mcp:drink_record_audit": { id: "11007" },
  "deribit-mcp:futures_open_interest": { currency: "BTC", kind: "future" },
  "gitlab-mcp:project_detail": { project: "gitlab-org/gitlab" },
  "gitlab-mcp:project_issues": { project: "gitlab-org/gitlab" },
  "hackertarget-mcp:as_lookup": { query: "8.8.8.8" },
  "jolpica-mcp:constructor_standings": { season: "current", limit: 5 },
  "jolpica-mcp:qualifying_report": { season: "current", round: "18", limit: 5 },
  "marketstack-mcp:symbol_dividend_ledger": { symbol: "AAPL", limit: 5 },
  "marketstack-mcp:price_window_review": { symbol: "AAPL", from: "2026-09-01", to: "2026-10-01", limit: 5 },
  "mastodon-mcp:account_lookup": { acct: "Gargron", instance: "mastodon.social" },
  "simplecast-mcp:feed_audit": { feed_url: "https://feeds.megaphone.fm/darknetdiaries" },
  "simplecast-mcp:audio_profile": { feed_url: "https://feeds.megaphone.fm/darknetdiaries", limit: 5 },
  "savvycal-mcp:calendar_arithmetic": { date: "2026-01-31", months: 1 },
  "savvycal-mcp:duration_report": { from: "2026-01-31", to: "2026-03-01" },
  "shootproof-mcp:daylight_profile": { lat: 51.5074, lon: -0.1278, date: "2026-06-21" },
  "shootproof-mcp:daylight_comparison": { locations: [{ name: "London", lat: 51.5074, lon: -0.1278 }], date: "2026-06-21" },
  "deribit-mcp:implied_vol_history": { currency: "BTC", period: "30d" },
  "twelvedata-mcp:fx_board": { base: "EUR" },
  "checkly-mcp:http_security_report": { url: "https://github.com" },
  "checkly-mcp:seo_meta": { url: "https://github.com" },
  "aimeleondore-mcp:shop_info": {},
  "aimeleondore-mcp:list_pages": { limit: 5 },
  "wise-mcp:incident_history": { limit: 6, area: "" },
  "weightsbiases-mcp:model_card_audit": { model: "google-bert/bert-base-uncased", siblings: 5 },
  "twitch-mcp:game_demand": { limit: 4 },
  "turbosquid-mcp:mesh_format_survey": { limit: 8 },
  "spreaker-mcp:publisher_profile": { user_id: "9808747", limit: 6 },
  "theoddsapi-mcp:implied_probability": { odds: "2.10,3.40,3.90" },
  "theoddsapi-mcp:expected_value": { bets: "0.55,2.10\n0.40,3.10", bankroll: 1000, kelly_fraction: 0.25 },
  "seatgeek-mcp:artist_briefing": { artist: "Radiohead", limit: 8 },
  "seatgeek-mcp:artist_catalogue": { artist: "Radiohead" },
  "rollbar-mcp:dependency_audit": { package: "lodash", ecosystem: "npm", version: "4.17.15", limit: 5 },
  "rollbar-mcp:advisory_detail": { id: "GHSA-29mw-wpgm-hmr9" },
  "rawg-mcp:steam_store_info": { app_id: 620 },
  "rawg-mcp:steam_reach": { app_id: 620 },
  "pusher-mcp:websocket_round_trip": { url: "wss://ws.postman-echo.com/raw", payload_kb: 4, samples: 3 },
  "pusher-mcp:websocket_payload_probe": { url: "wss://ws.postman-echo.com/raw", large_kb: 8 },
  "fmp-mcp:currency_rates": { base: "USD", symbols: ["EUR", "JPY"] },
  "fmp-mcp:fx_history": { pair: "EURUSD", start: "2026-09-01", end: "2026-10-01", limit: 5 },
  "fmp-mcp:price_history": { symbol: "AAPL", range: "1mo", interval: "1d", limit: 5 },
  "arweave-mcp:price_table": { sizes_mb: [1, 10] },
  "google-books-mcp:isbn_lookup": { isbn: "9780441478125" },
  "google-books-mcp:author_works": { author: "Ursula K. Le Guin" },
  "helius-mcp:wallet_holdings": { address: "4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T", limit: 10 },
  "helius-mcp:token_market": { token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", limit: 3 },
  "invoice-mcp:vat_number_check": { vat_number: "DE893704004" },
  "invoice-mcp:iban_check": { iban: "DE89370400440532013000" },
  "invoice-mcp:currency_reference": { amount: 250, from: "USD", to: "EUR" },
  "lemonsqueezy-mcp:fee_breakdown": { amount: 49, currency: "USD" },
  "lemonsqueezy-mcp:payout_schedule": { from_date: "2026-01-01", periods: 4, min_threshold: 100, reserve_rate: 0.05, starting_balance: 1000 },
  "mailgun-mcp:dkim_selector_scan": { domain: "google.com", selector: "google" },
  "mobygames-mcp:steam_game_profile": { appid: 620, limit: 5 },
  "mobygames-mcp:steam_specials_census": { limit: 5 },
  "omdb-mcp:wikidata_facts": { id: "Q184843", title: "Blade Runner" },
  "omdb-mcp:cinemeta_details": { imdb_id: "tt0083658" },
  "onesignal-mcp:sdk_release_timeline": { package: "onesignal-cordova-plugin", limit: 5 },
  "onesignal-mcp:platform_status": { limit: 10 },
  "openrouteservice-mcp:osrm_route_steps": { from_lat: 52.517037, from_lon: 13.38886, to_lat: 52.529407, to_lon: 13.397634 },
  "openrouteservice-mcp:valhalla_mode_compare": { from_lat: 52.517037, from_lon: 13.38886, to_lat: 52.529407, to_lon: 13.397634 },
  "pinata-mcp:decode_cid": { cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG" },
  "pinata-mcp:compare_cids": { cids: ["QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"] },
  "pinterest-mcp:find_licensed_images": { query: "cat", limit: 3 },
  "pinterest-mcp:image_licence": { id: "1c5442f6-6bb6-4ab7-b603-f598e7579dd2" },
  "plain-mcp:email_deliverability": { email: "user@gmail.com" },
  "plain-mcp:response_time_report": { target_hours: 24, samples: [{ label: "a", created_at: "2026-10-20T10:00:00Z", first_reply_at: "2026-10-20T12:00:00Z" }, { label: "b", created_at: "2026-10-19T09:00:00Z", first_reply_at: "2026-10-21T15:00:00Z" }, { label: "c", created_at: "2026-10-18T08:00:00Z", first_reply_at: "2026-10-18T09:30:00Z" }] },
  "producthunt-mcp:show_hn_launches": { days: 7, limit: 3 },
  "producthunt-mcp:github_footprint": { repo: "facebook/react" },
  "producthunt-mcp:competitive_scan": { query: "mcp server", limit: 3 },
};

function sampleFor(arg) {
  const n = arg.name.toLowerCase();
  if (n in SAMPLES) return SAMPLES[n];
  const hit = Object.keys(SAMPLES).find((k) => n.includes(k));
  if (hit) return SAMPLES[hit];
  if (arg.type === "str" || arg.type === "string") return "example";
  return "5";
}

function coerce(arg, value) {
  if (arg.type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 5;
  }
  if (arg.type === "boolean") return true;
  return String(value);
}

function session(pkg) {
  const dir = join(PUBLISHED, pkg);
  if (!existsSync(join(dir, "dist", "index.js"))) return null;
  const child = spawn(process.execPath, [join(dir, "dist", "index.js")], {
    cwd: dir,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, MCP_LICENSE_KEY: "" },
  });
  let buf = "";
  let err = "";
  const waiters = new Map();
  child.stderr.on("data", (d) => {
    err += d.toString();
  });
  child.on("exit", () => {
    for (const [, fn] of waiters) fn({ error: { message: "exited: " + err.slice(-160) } });
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
  const call = (method, params, id, timeout = 120000) =>
    new Promise((resolve) => {
      const t = setTimeout(() => resolve({ error: { message: "timeout" } }), timeout);
      waiters.set(id, (msg) => {
        clearTimeout(t);
        resolve(msg);
      });
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, id, params }) + "\n");
    });
  return { call, close: () => child.kill() };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];

for (const pkg of pkgs) {
  const stubs = SPEC.filter((r) => r.pkg === pkg);
  if (!stubs.length) {
    console.log(`${pkg}: not in the stub list, skipping`);
    continue;
  }
  const s = session(pkg);
  if (!s) {
    rows.push({ pkg, tool: "(load)", ok: false, kind: "no-dist", out: "missing dist/index.js" });
    console.log(`${pkg}: NO DIST`);
    continue;
  }
  const init = await s.call("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "v", version: "1" } }, 0, 20000);
  if (init.error) {
    rows.push({ pkg, tool: "(init)", ok: false, kind: "init", out: init.error.message });
    console.log(`${pkg}: INIT FAIL ${init.error.message}`);
    s.close();
    continue;
  }
  const listed = await s.call("tools/list", {}, 1, 20000);
  const tools = Object.fromEntries((listed.result?.tools ?? []).map((t) => [t.name, t.inputSchema ?? {}]));

  for (const stub of stubs) {
    const schema = tools[stub.tool];
    if (!schema) {
      rows.push({ pkg, tool: stub.tool, ok: false, kind: "missing-tool", out: "not registered" });
      console.log(`  FAIL ${stub.tool}: not registered`);
      continue;
    }
    const props = schema.properties ?? {};
    const required = schema.required ?? Object.keys(props).filter((k) => !props[k]?.optional);
    const args = { ...(OVERRIDES[`${pkg}:${stub.tool}`] ?? {}) };
    for (const key of required) {
      if (key in args) continue;
      const prop = props[key] ?? {};
      if (prop.type === "array") {
        args[key] = [];
        continue;
      }
      if (prop.type === "number" || prop.type === "integer") {
        const min = Number(prop.minimum ?? 1);
        const max = Number(prop.maximum ?? Number.MAX_SAFE_INTEGER);
        const guess = key === "id" ? 90 : Number(SAMPLES[key] ?? prop.default ?? 5);
        args[key] = Math.min(max, Math.max(min, guess));
        continue;
      }
      if (prop.type === "boolean") {
        args[key] = true;
        continue;
      }
      args[key] = String(prop.enum?.[0] ?? sampleFor({ name: key, type: prop.type }));
    }
    const r = await s.call("tools/call", { name: stub.tool, arguments: args }, 2, 150000);
    const text = (r.result?.content ?? []).map((c) => c.text ?? "").join("\n");
    const body = text || r.error?.message || "";
    const isErr = Boolean(r.result?.isError) || Boolean(r.error);
    const clean = /set [A-Z_]{4,}|needs .*key|requires .*key|not configured|no api key/i.test(body);
    const kind = r.error ? "rpc-error" : r.result?.isError ? "tool-error" : "data";
    rows.push({ pkg, tool: stub.tool, ok: !isErr, kind, needsKey: clean, out: body.slice(0, 500) });
    const flag = !isErr ? "ok  " : clean ? "key " : "FAIL";
    console.log(`  ${flag} ${stub.tool}: ${body.replace(/\s+/g, " ").slice(0, 150)}`);
    await sleep(2500);
  }
  s.close();
  await sleep(2500);
}

appendFileSync(RESULTS, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
const data = rows.filter((r) => r.ok).length;
const keyed = rows.filter((r) => !r.ok && r.needsKey).length;
const bad = rows.filter((r) => !r.ok && !r.needsKey);
console.log(`\nchecked ${rows.length}: data ${data}, needs-key ${keyed}, broken ${bad.length}`);
for (const r of bad) console.log(`  BAD ${r.pkg} ${r.tool} (${r.kind}) ${String(r.out).replace(/\s+/g, " ").slice(0, 200)}`);
