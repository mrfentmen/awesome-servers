/**
 * Live smoke test against the real bioRxiv API.
 */
import { spawn } from "node:child_process"

const CASES = [
  { tool: "papers", args: { start: "2024-01-01", end: "2024-01-03" }, expect: "preprints" },
  { tool: "paper", args: { doi: "10.1101/2023.12.30.573731" }, expect: "DOI:" },
]

const child = spawn(process.execPath, ["dist/index.js"], { stdio: ["pipe", "pipe", "pipe"] })
let stderr = ""
child.stderr.on("data", (d) => {
  stderr += d.toString()
})

let buf = ""
const pending = new Map()
child.stdout.on("data", (d) => {
  buf += d.toString()
  let i
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim()
    buf = buf.slice(i + 1)
    if (!line) continue
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      continue
    }
    const resolve = pending.get(msg.id)
    if (resolve) {
      pending.delete(msg.id)
      resolve(msg)
    }
  }
})

function send(id, method, params) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 60000)
    pending.set(id, (m) => {
      clearTimeout(timer)
      if (m.error) reject(new Error(`${method} failed: ${JSON.stringify(m.error)}`))
      else resolve(m.result)
    })
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  })
}

const fail = (msg) => {
  console.error(`FAIL ${msg}`)
  console.error(stderr.trim())
  child.kill()
  process.exit(1)
}

try {
  const init = await send(1, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke", version: "1.0.0" },
  })
  if (!init?.serverInfo?.name) fail("initialize returned no serverInfo")
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }) + "\n")

  const { tools } = await send(2, "tools/list", {})
  const names = (tools ?? []).map((t) => t.name)

  let id = 3
  for (const c of CASES) {
    if (!names.includes(c.tool)) fail(`tools/list is missing ${c.tool}`)
    const call = await send(id++, "tools/call", { name: c.tool, arguments: c.args })
    const out = (call?.content ?? []).map((x) => x.text ?? "").join("\n")
    if (call?.isError) fail(`${c.tool} returned isError: ${out.slice(0, 200)}`)
    if (!out.toLowerCase().includes(c.expect.toLowerCase())) fail(`${c.tool} output missing "${c.expect}": ${out.slice(0, 200)}`)
    console.log(`PASS ${c.tool} ${JSON.stringify(c.args)} -> ${out.split("\n")[0].slice(0, 70)}`)
  }

  console.log(`PASS tools=${names.length} [${names.join(", ")}]`)
  child.kill()
  process.exit(0)
} catch (e) {
  fail(e.message)
}
