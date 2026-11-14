import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

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

const sample = [
  { id: "t1", name: "White tee", category: "top", color: "white", season: ["all"], formality: "casual", cost: 20, wearCount: 20, lastWorn: "2026-11-01", condition: "good" },
  { id: "t2", name: "Blue shirt", category: "top", color: "blue", season: ["all"], formality: "business", cost: 60, wearCount: 6, lastWorn: "2026-10-20", condition: "good" },
  { id: "b1", name: "Jeans", category: "bottom", color: "blue", season: ["all"], formality: "casual", cost: 80, wearCount: 4, lastWorn: "2026-11-02", condition: "good" },
  { id: "b2", name: "Black trousers", category: "bottom", color: "black", season: ["all"], formality: "business", cost: 90, wearCount: 9, lastWorn: "2026-10-30", condition: "good" },
  { id: "s1", name: "Sneakers", category: "shoes", color: "white", season: ["all"], formality: "casual", cost: 100, wearCount: 10, lastWorn: "2026-11-03", condition: "good" },
  { id: "o1", name: "Trench", category: "outerwear", color: "tan", season: ["fall", "winter"], formality: "smart-casual", cost: 200, wearCount: 5, lastWorn: "2026-10-25", condition: "good" },
  { id: "u1", name: "Underwear", category: "underwear", color: "black", season: ["all"], formality: "casual", cost: 0, wearCount: 100, lastWorn: "2026-11-03", condition: "good" },
  { id: "a1", name: "Belt", category: "accessory", color: "black", season: ["all"], formality: "casual", cost: 30, wearCount: 15, lastWorn: "2026-11-01", condition: "good" },
  { id: "d1", name: "Wrap dress", category: "dress", color: "black", season: ["all"], formality: "formal", cost: 120, wearCount: 2, lastWorn: "2026-09-01", condition: "good" },
  { id: "w1", name: "Old hoodie", category: "top", color: "gray", season: ["all"], formality: "casual", cost: 40, wearCount: 1, lastWorn: "2026-01-01", condition: "worn" },
]

const expectedTools = [
  "inventory_capsule_wardrobe",
  "score_capsule_wardrobe_readiness",
  "audit_capsule_wardrobe_coverage",
  "flag_capsule_wardrobe_gaps",
  "rank_capsule_wardrobe_risks",
  "check_capsule_wardrobe_constraints",
  "compare_capsule_wardrobe_baseline",
  "estimate_capsule_wardrobe_cost_per_wear",
  "find_capsule_wardrobe_quick_wins",
  "map_capsule_wardrobe_dependencies",
  "test_capsule_wardrobe_edge_cases",
  "summarize_capsule_wardrobe_findings",
  "prioritize_capsule_wardrobe_fixes",
  "validate_capsule_wardrobe_inputs",
  "detect_capsule_wardrobe_duplicates",
  "measure_capsule_wardrobe_variance",
  "benchmark_capsule_wardrobe_options",
  "explain_capsule_wardrobe_tradeoffs",
  "draft_capsule_wardrobe_checklist",
  "export_capsule_wardrobe_audit",
  "track_capsule_wardrobe_changes",
  "review_capsule_wardrobe_history",
  "score_capsule_wardrobe_confidence",
  "recommend_capsule_wardrobe_next_steps",
  "open_capsule_wardrobe_questions",
]

test("server boots and registers 25 tools", async () => {
  const answers = await call([toolsList])
  const listed = answers.get(1)
  assert.ok(listed.result, "expected tools/list result")
  assert.equal(listed.result.tools.length, 25)
  const names = new Set(listed.result.tools.map((tool) => tool.name))
  for (const required of expectedTools) assert.ok(names.has(required), `missing tool ${required}`)
})

test("every tool has a description and schema", async () => {
  const answers = await call([toolsList])
  for (const tool of answers.get(1).result.tools) {
    assert.match(tool.name, /^[a-z0-9_]+$/)
    assert.ok(tool.description.length > 10, `${tool.name} needs a real description`)
    assert.equal(typeof tool.inputSchema, "object", `${tool.name} needs an input schema`)
  }
})

test("inventory counts categories, spend and wears", async () => {
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "inventory_capsule_wardrobe", arguments: { items: sample } },
    },
  ])
  const result = answers.get(1).result
  assert.notEqual(result.isError, true, result.content[0].text)
  const data = JSON.parse(result.content[0].text)
  assert.equal(data.items, 10)
  assert.equal(data.categories.top, 3)
  assert.equal(data.categories.bottom, 2)
  assert.equal(data.categories.dress, 1)
  assert.equal(data.totalCost, 740)
  assert.equal(data.totalWears, 172)
})

test("cost per wear is calculated from cost and wear count", async () => {
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "estimate_capsule_wardrobe_cost_per_wear", arguments: { items: sample } },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.averageCpw, 19.3)
  const tee = data.items.find((item) => item.id === "t1")
  const jeans = data.items.find((item) => item.id === "b1")
  assert.equal(tee.cpw, 1)
  assert.equal(jeans.cpw, 20)
})

test("gaps find missing categories", async () => {
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "flag_capsule_wardrobe_gaps", arguments: { items: sample } },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  const activewear = data.gaps.find((gap) => gap.type === "category" && gap.key === "activewear")
  assert.ok(activewear, "expected an activewear gap")
  assert.equal(activewear.missing, 3)
})

test("duplicates are grouped by category, name and color", async () => {
  const withDuplicate = [
    ...sample,
    { id: "t1-copy", name: " white tee ", category: "top", color: "white", season: ["all"], formality: "casual", cost: 20, wearCount: 3, lastWorn: "2026-10-01", condition: "good" },
  ]
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "detect_capsule_wardrobe_duplicates", arguments: { items: withDuplicate } },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.count, 1)
  assert.equal(data.wastedItems, 1)
  assert.deepEqual(data.duplicates[0].ids.sort(), ["t1", "t1-copy"])
})

test("track changes reports added and removed items", async () => {
  const newer = sample.filter((item) => item.id !== "w1")
  newer.push({ id: "s2", name: "Boots", category: "shoes", color: "black", season: ["fall", "winter"], formality: "smart-casual", cost: 150, wearCount: 2, lastWorn: "2026-11-01", condition: "new" })
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "track_capsule_wardrobe_changes", arguments: { before: { items: sample }, after: { items: newer } } },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.counts.added, 1)
  assert.equal(data.counts.removed, 1)
  assert.equal(data.added[0].id, "s2")
  assert.equal(data.removed[0].id, "w1")
})

test("history trend reports first-to-last deltas", async () => {
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "review_capsule_wardrobe_history",
        arguments: {
          history: [
            { date: "2026-10-01", items: sample },
            { date: "2026-11-01", items: sample.slice(0, 8) },
          ],
        },
      },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.points.length, 2)
  assert.equal(data.delta.items, -2)
})

test("invalid input is rejected without crashing", async () => {
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "validate_capsule_wardrobe_inputs",
        arguments: { items: [{ id: "bad", name: "", category: "hat" }] },
      },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.valid, false)
  assert.ok(data.issues.some((issue) => issue.severity === "error"))
})

test("full audit exports the main sections", async () => {
  const answers = await call([
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "export_capsule_wardrobe_audit",
        arguments: { items: sample, target: { maxItems: 30, budget: 1000, targetCpw: 10 } },
      },
    },
  ])
  const data = JSON.parse(answers.get(1).result.content[0].text)
  assert.equal(data.itemCount, 10)
  assert.ok(data.summary)
  assert.ok(Array.isArray(data.gaps))
  assert.ok(Array.isArray(data.risks))
  assert.ok(Array.isArray(data.nextSteps))
  assert.equal(data.target.maxItems, 30)
})
