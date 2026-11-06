import test from "node:test"
import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const server = path.join(here, "..", "src", "analysis_mcp.py")

function pickPython() {
  for (const cmd of ["python3", "python"]) {
    const r = spawnSync(cmd, ["--version"], { stdio: "ignore" })
    if (r.status === 0) return cmd
  }
  return null
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url")
}

async function readLines(child, n) {
  const lines = []
  let buf = ""
  child.stdout.on("data", (d) => {
    buf += String(d)
    let i
    while ((i = buf.indexOf("\n")) >= 0) {
      lines.push(buf.slice(0, i))
      buf = buf.slice(i + 1)
    }
  })
  while (lines.length < n) {
    await new Promise((r) => setTimeout(r, 50))
    assert.ok(child.exitCode === null, `server exited early: ${child.exitCode}`)
    if (lines.length >= n) break
  }
  return lines.slice(0, n)
}

test("analysis-mcp handshake, tools/list and jwt_decode", async () => {
  const py = pickPython()
  assert.ok(py, "python3 not found on PATH")
  const child = spawn(py, [server], { stdio: ["pipe", "pipe", "pipe"] })
  try {
    const token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({ sub: "1", role: "admin" })}.sig`
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) + "\n")
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n")
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) + "\n")
    child.stdin.write(JSON.stringify({
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "jwt_decode", arguments: { token } },
    }) + "\n")

    const [initLine, toolsLine, callLine] = await readLines(child, 3)
    const init = JSON.parse(initLine)
    assert.equal(init.result.serverInfo.name, "analysis")

    const tools = JSON.parse(toolsLine)
    const names = tools.result.tools.map((t) => t.name)
    for (const expected of [
      "extract_endpoints", "diff_responses", "jwt_decode",
      "corpus_search", "corpus_topics", "parse_burp",
    ]) {
      assert.ok(names.includes(expected), `missing tool ${expected}`)
    }

    const call = JSON.parse(callLine)
    const text = call.result.content[0].text
    assert.match(text, /PAYLOAD/)
    assert.match(text, /role' = admin/)
    assert.match(text, /NO exp claim/)
  } finally {
    child.kill()
  }
})
