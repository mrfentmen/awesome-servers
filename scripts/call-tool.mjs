#!/usr/bin/env node
// Start a mirrored package over stdio and call one tool, the way a client does.
//   node scripts/call-tool.mjs <package> <tool> '<json args>' [timeoutMs]

import { spawn } from "node:child_process";
import { join } from "node:path";

const [, , pkg, tool, argsJson = "{}", timeoutRaw] = process.argv;
const timeout = Number(timeoutRaw ?? 120000);
const dir = join("/tmp/pm/published", pkg);

const child = spawn(process.execPath, [join(dir, "dist", "index.js")], {
  cwd: dir,
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, MCP_LICENSE_KEY: "" },
});

let buf = "";
let stderr = "";
const send = (o) => child.stdin.write(JSON.stringify(o) + "\n");

child.stderr.on("data", (d) => {
  stderr += d.toString().slice(0, 2000);
});

child.stdout.on("data", (d) => {
  buf += d.toString();
  let idx;
  while ((idx = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let m;
    try {
      m = JSON.parse(line);
    } catch {
      continue;
    }
    if (m.id === 1) {
      send({
        jsonrpc: "2.0",
        method: "tools/call",
        id: 2,
        params: { name: tool, arguments: JSON.parse(argsJson) },
      });
    }
    if (m.id === 2) {
      const parts = (m.result?.content ?? []).map((c) => c.text ?? "");
      const out = parts.join("\n") || JSON.stringify(m.result ?? m.error);
      console.log(out.slice(0, 20000));
      child.kill();
      process.exit(m.result?.isError ? 2 : 0);
    }
  }
});

send({
  jsonrpc: "2.0",
  method: "initialize",
  id: 0,
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "verify", version: "1" },
  },
});
setTimeout(
  () => send({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
  400,
);
setTimeout(() => {
  console.log("TIMEOUT");
  if (stderr) console.log("stderr:", stderr.slice(0, 600));
  child.kill();
  process.exit(1);
}, timeout);
