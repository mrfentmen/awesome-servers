import test from "node:test"
import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const server = path.join(here, "..", "src", "research_mcp.py")

function pickPython() {
  for (const cmd of ["python3", "python"]) {
    const r = spawnSync(cmd, ["--version"], { stdio: "ignore" })
    if (r.status === 0) return cmd
  }
  return null
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

test("research-mcp handshake, tools/list, unknown tool error", async () => {
  const py = pickPython()
  assert.ok(py, "python3 not found on PATH")
  const child = spawn(py, [server], { stdio: ["pipe", "pipe", "pipe"] })
  try {
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) + "\n")
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n")
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) + "\n")
    child.stdin.write(JSON.stringify({
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "nope", arguments: {} },
    }) + "\n")

    const [initLine, toolsLine, callLine] = await readLines(child, 3)
    const init = JSON.parse(initLine)
    assert.equal(init.result.serverInfo.name, "research")

    const tools = JSON.parse(toolsLine)
    const names = tools.result.tools.map((t) => t.name)
    assert.deepEqual(names.sort(), ["market_check", "suggest", "trend"])

    const call = JSON.parse(callLine)
    assert.equal(call.error.code, -32603)
    assert.match(call.error.message, /unknown tool: nope/)
  } finally {
    child.kill()
  }
})
