import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { config } from "../dist/config.js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const prefix = config.prefix
const tool = {
  inventory: `inventory_${prefix}`,
  score: `score_${prefix}_readiness`,
  coverage: `audit_${prefix}_coverage`,
  gaps: `flag_${prefix}_gaps`,
  metric: `estimate_${prefix}_${config.metric.id}`,
  validate: `validate_${prefix}_inputs`,
  duplicates: `detect_${prefix}_duplicates`,
  changes: `track_${prefix}_changes`,
  history: `review_${prefix}_history`,
  export: `export_${prefix}_audit`,
}
const expectedTools = Object.values(tool).concat([
  `rank_${prefix}_risks`,
  `check_${prefix}_constraints`,
  `compare_${prefix}_baseline`,
  `find_${prefix}_quick_wins`,
  `map_${prefix}_dependencies`,
  `test_${prefix}_edge_cases`,
  `summarize_${prefix}_findings`,
  `prioritize_${prefix}_fixes`,
  `measure_${prefix}_variance`,
  `benchmark_${prefix}_options`,
  `explain_${prefix}_tradeoffs`,
  `draft_${prefix}_checklist`,
  `score_${prefix}_confidence`,
  `recommend_${prefix}_next_steps`,
  `open_${prefix}_questions`,
])

function call(requests) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["dist/index.js"], {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, MCP_LICENSE_KEY: "" },
    })
    let buf = ""
    const answers = new Map()
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error("server did not answer within 10s"))
    }, 10000)
    child.stdout.on("data", (chunk) => {
      buf += chunk.toString()
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
        if (msg.id !== undefined && msg.id !== null && msg.id !== 0) answers.set(msg.id, msg)
        if (requests.every((_, index) => answers.has(index + 1))) {
          clearTimeout(timer)
          child.kill()
          resolve(answers)
        }
      }
    })
    child.stderr.on("data", () => {})
    child.on("error", reject)
    const send = (value) => child.stdin.write(JSON.stringify(value) + "\n")
    send({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" },
      },
    })
    setTimeout(() => send({ jsonrpc: "2.0", method: "notifications/initialized" }), 100)
    requests.forEach((request, index) => setTimeout(() => send({ ...request, id: index + 1 }), 150 + index * 40))
  })
}

const toolsList = { jsonrpc: "2.0", method: "tools/list" }
const sample = config.sample

test("server boots and registers 25 tools", async () => {
  const answers = await call([toolsList])
  const listed = answers.get(1)
  assert.ok(listed.result, "expected tools/list result")
  assert.equal(listed.result.tools.length, 25)
  const names = new Set(listed.result.tools.map((item) => item.name))
  for (const required of expectedTools) assert.ok(names.has(required), `missing tool ${required}`)
})

test("every tool has a description and schema", async () => {
  const answers = await call([toolsList])
  for (const item of answers.get(1).result.tools) {
    assert.match(item.name, /^[a-z0-9_]+$/)
    assert.ok(item.description.length > 10, `${item.name} needs a real description`)
    assert.equal(typeof item.inputSchema, "object", `${item.name} needs an input schema`)
  }
})

test("inventory counts the shipped sample", async () => {
  const answers = await call([
    { jsonrpc: "2.0", method: "tools/call", params: { name: tool.inventory, arguments: { items: sample } } },
  ])
  const result = answers.get(1).result
  assert.notEqual(result.isError, true, result.content[0].text)
  const data = JSON.parse(result.content[0].text)
  assert.equal(data.items, sample.length)
  assert.equal(data.categories[config.categories[0].id] >= 1, true)
})

test("coverage returns every configured category", async () => {
  const answers = await call([
    { jsonrpc: "2.0", method: "tools/call", params: { name: tool.coverage, arguments: { items: sample } } },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  for (const category of config.categories) assert.equal(typeof data.category[category.id], "number")
})

test("gaps are returned as structured objects", async () => {
  const answers = await call([
    { jsonrpc: "2.0", method: "tools/call", params: { name: tool.gaps, arguments: { items: sample } } },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.ok(Array.isArray(data.gaps))
  assert.ok(data.gaps.every((gap) => typeof gap.message === "string"))
})

test("metric tool reports rows and a target", async () => {
  const answers = await call([
    { jsonrpc: "2.0", method: "tools/call", params: { name: tool.metric, arguments: { items: sample } } },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.metric.id, config.metric.id)
  assert.equal(data.rows.length, sample.length)
  assert.equal(typeof data.mean, "number")
})

test("validation accepts bad JSON without crashing", async () => {
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: tool.validate, arguments: { items: [{ id: "bad", name: "", category: "" }] } },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.valid, false)
  assert.ok(data.issues.some((issue) => issue.severity === "error"))
})

test("duplicates are grouped by category and name", async () => {
  const duplicate = { ...sample[0], id: "duplicate-copy" }
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: tool.duplicates, arguments: { items: [...sample, duplicate] } },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.count, 1)
  assert.equal(data.wastedItems, 1)
})

test("change tracking reports an added item", async () => {
  const newItem = { id: "new-item", name: "New item", category: config.categories[0].id, cost: 1, quantity: 1 }
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: tool.changes, arguments: { before: { items: sample }, after: { items: [...sample, newItem] } } },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.counts.added, 1)
  assert.equal(data.added[0].id, "new-item")
})

test("history reports a delta", async () => {
  const shorter = sample.slice(0, Math.max(1, sample.length - 1))
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: tool.history,
        arguments: {
          history: [
            { date: "2026-10-01", items: sample },
            { date: "2026-11-01", items: shorter },
          ],
        },
      },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.points.length, 2)
  assert.equal(data.delta.items, shorter.length - sample.length)
})

test("full export includes summary and next steps", async () => {
  const answers = await call([
    { jsonrpc: "2.0", method: "tools/call", params: { name: tool.export, arguments: { items: sample } } },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.itemCount, sample.length)
  assert.ok(data.summary)
  assert.ok(Array.isArray(data.gaps))
  assert.ok(Array.isArray(data.risks))
  assert.ok(Array.isArray(data.nextSteps))
})
