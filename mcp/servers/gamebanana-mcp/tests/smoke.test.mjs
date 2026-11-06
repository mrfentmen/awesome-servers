import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const server = path.join(here, "..", "dist", "index.js")

function rpc(child, msg) {
  child.stdin.write(JSON.stringify(msg) + "\n")
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

test("gamebanana-mcp stdio handshake + tools/list", async () => {
  const child = spawn("node", [server], { stdio: ["pipe", "pipe", "pipe"] })
  try {
    rpc(child, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "smoke", version: "0.0.0" },
      },
    })
    rpc(child, { jsonrpc: "2.0", method: "notifications/initialized" })
    rpc(child, { jsonrpc: "2.0", id: 2, method: "tools/list" })
    const [initLine, toolsLine] = await readLines(child, 2)

    const init = JSON.parse(initLine)
    assert.equal(init.result.serverInfo.name, "gamebanana-mcp")

    const tools = JSON.parse(toolsLine)
    const names = tools.result.tools.map((t) => t.name)
    assert.deepEqual(
      names.sort(),
      ["get_game_mods", "get_mod", "search_games", "search_mods"]
    )
  } finally {
    child.kill()
  }
})
