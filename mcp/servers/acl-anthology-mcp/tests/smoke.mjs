/**
 * Live smoke test: starts the built server over stdio, lists tools, then calls
 * one tool against the real Anthology. Fails loudly if the server or the site breaks.
 */
import { spawn } from "node:child_process"

const EXPECT_TOOL = "paper"
const EXPECT_ARG = { paper_id: "2024.acl-long.1" }
const EXPECT_TEXT = "Quantized Side Tuning"

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

function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n")
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
  notify("notifications/initialized", {})

  const { tools } = await send(2, "tools/list", {})
  const names = (tools ?? []).map((t) => t.name)
  if (!names.includes(EXPECT_TOOL)) fail(`tools/list is missing ${EXPECT_TOOL} (got: ${names.join(", ")})`)

  const call = await send(3, "tools/call", { name: EXPECT_TOOL, arguments: EXPECT_ARG })
  const out = (call?.content ?? []).map((c) => c.text ?? "").join("\n")
  if (call?.isError) fail(`${EXPECT_TOOL} returned isError: ${out.slice(0, 200)}`)
  if (!out.toLowerCase().includes(EXPECT_TEXT.toLowerCase())) {
    fail(`${EXPECT_TOOL} output did not contain "${EXPECT_TEXT}": ${out.slice(0, 200)}`)
  }

  console.log(`PASS tools=${names.length} [${names.join(", ")}]`)
  console.log(`PASS ${EXPECT_TOOL} -> ${out.split("\n")[0].slice(0, 90)}`)
  child.kill()
  process.exit(0)
} catch (e) {
  fail(e.message)
}
