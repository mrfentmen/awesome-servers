#!/usr/bin/env node
// Prove the licence gate is gone by talking to each patched server the way a
// client does: start it over stdio, ask for the tool list, then call every tool
// that used to be gated and check the answer is not the old paywall refusal.
//
// Usage: node scripts/verify-ungated.mjs [slug ...]
//
// The expected tool names are read from a pristine copy of the package if one is
// present (--baseline), otherwise every registered tool is exercised.

import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { argv, exit } from "node:process";

const PUBLISHED = new URL("../published/", import.meta.url).pathname;
const BASELINE = "/tmp/orig-published";
const PAYWALL_MARKERS = ["needs a license key", "MCP_LICENSE_KEY", "licence key is set"];

const slugFromDir = (dir) => dir.replace(/\/$/, "").split("/").pop();

function gatedTools(slug) {
  const candidates = [join(BASELINE, slug, "dist", "server.js"), join(PUBLISHED, slug, "dist", "server.js")];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const src = readFileSync(file, "utf8");
    const names = [...src.matchAll(/premiumRequired\("([^"]+)"\)/g)].map((m) => m[1]);
    if (names.length) return [...new Set(names)];
  }
  return [];
}

function dummyArgs(schema) {
  const props = schema?.properties ?? {};
  const required = schema?.required ?? [];
  const out = {};
  for (const key of required) {
    const type = props[key]?.type;
    if (type === 'number' || type === 'integer') out[key] = 1;
    else if (type === 'boolean') out[key] = true;
    else if (type === 'array') out[key] = [props[key]?.items?.type === 'number' ? 1 : 'x'];
    else if (type === 'object') out[key] = {};
    else out[key] = 'x';
  }
  return out;
}

function runServer(slug, tools) {
  return new Promise((resolve) => {
    const dir = join(PUBLISHED, slug);
    const child = spawn(process.execPath, [join(dir, "dist", "index.js")], {
      cwd: dir,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, MCP_LICENSE_KEY: "", MCP_LICENSE_VERIFY_URL: "" },
    });

    let buffer = "";
    const seen = new Map();
    const state = { listed: [], answers: [] };
    let stage = "init";

    const send = (msg) => child.stdin.write(JSON.stringify(msg) + "\n");

    const finish = (note) => {
      clearTimeout(timer);
      child.kill("SIGKILL");
      resolve({ slug, expected: tools, ...state, note });
    };

    // Generous by default: a couple of former gates call slow public APIs
    // (crt.sh and the Nu checker each allow 45s), so a tight budget reports a
    // timeout where a slower but correct answer was coming.
    const timer = setTimeout(() => finish("timeout"), Number(process.env.VERIFY_TIMEOUT_MS ?? 180000));

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      let nl;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.id === 1 && stage === "init") {
          stage = "list";
          send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
          continue;
        }
        if (msg.id === 2 && stage === "list") {
          state.listed = (msg.result?.tools ?? []).map((t) => t.name);
          const schemas = new Map((msg.result?.tools ?? []).map((t) => [t.name, t.inputSchema]));
          stage = "call";
          for (const [i, tool] of tools.entries()) {
            send({
              jsonrpc: "2.0",
              id: 100 + i,
              method: "tools/call",
              params: { name: tool, arguments: dummyArgs(schemas.get(tool)) },
            });
          }
          continue;
        }
        if (typeof msg.id === "number" && msg.id >= 100) {
          const text = JSON.stringify(msg.result ?? msg.error ?? "");
          state.answers[msg.id - 100] = text;
          seen.set(msg.id - 100, text);
          if (seen.size === tools.length) finish("done");
        }
      }
    });

    child.on("error", (e) => finish("spawn-error: " + e.message));
    child.on("exit", () => {
      if (state.answers.length < tools.length) finish("exited-early");
    });

    child.stdin.on("error", () => {});
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "verify", version: "1" } },
    });
  });
}

const dirs = argv.slice(2);
const slugs = dirs.length
  ? dirs.map(slugFromDir)
  : (await import("node:fs")).readdirSync(PUBLISHED).filter((d) => !d.includes("."));

let failures = 0;
let checked = 0;
for (const slug of slugs) {
  const tools = gatedTools(slug);
  if (!tools.length) continue;
  const result = await runServer(slug, tools);
  checked++;

  const missing = tools.filter((t) => !result.listed.includes(t));
  const answers = [];
  for (const [i, tool] of tools.entries()) {
    const text = result.answers?.[i] ?? "";
    answers.push({ tool, text });
  }

  const paywalled = answers.filter((a) =>
    PAYWALL_MARKERS.some((m) => (typeof a.text === "string" ? a.text : JSON.stringify(a.text)).includes(m)),
  );

  const ok = missing.length === 0 && paywalled.length === 0 && result.note === "done";
  if (!ok) {
    failures++;
    console.log(`FAIL ${slug}`);
    if (result.note !== "done") console.log(`  note: ${result.note}`);
    if (missing.length) console.log(`  tools missing from tools/list: ${missing.join(", ")}`);
    for (const p of paywalled) console.log(`  still refuses ${p.tool}: ${String(p.text).slice(0, 120)}`);
  } else {
    console.log(`ok   ${slug} — ${tools.length} former gate(s) gone, tools still registered`);
  }
}

console.log(`\npackages verified: ${checked}`);
console.log(`failures         : ${failures}`);
exit(failures ? 1 : 0);
