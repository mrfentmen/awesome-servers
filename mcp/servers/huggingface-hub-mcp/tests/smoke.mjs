/**
 * Live smoke test: real Hugging Face API, real stdio MCP calls.
 */
import { spawn } from "node:child_process"

const MODEL = "hf-internal-testing/tiny-random-LlamaForCausalLM"
const CARD_MODEL = "bert-base-uncased"

const child = spawn(process.execPath, ["dist/index.js"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, HF_TOKEN: "" },
})
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
    const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 45000)
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

async function call(id, name, args) {
  const result = await send(id, "tools/call", { name, arguments: args })
  const out = (result?.content ?? []).map((c) => c.text ?? "").join("\n")
  return { result, out }
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
  const names = (tools ?? []).map((t) => t.name).sort()
  for (const wanted of ["dataset_info", "list_files", "model_info", "read_card", "search_datasets", "search_models"]) {
    if (!names.includes(wanted)) fail(`tools/list is missing ${wanted} (got: ${names.join(", ")})`)
  }
  console.log(`PASS tools=${names.length} [${names.join(", ")}]`)

  const search = await call(3, "search_models", { query: "tiny-random-llama", limit: 5 })
  if (search.result?.isError) fail(`search_models failed: ${search.out}`)
  const searchData = JSON.parse(search.out)
  if (!searchData.models.some((m) => m.id?.includes("tiny-random"))) fail(`unexpected search: ${search.out}`)
  console.log(`PASS search_models count=${searchData.count}`)

  const info = await call(4, "model_info", { repo: MODEL })
  if (info.result?.isError) fail(`model_info failed: ${info.out}`)
  const model = JSON.parse(info.out)
  if (model.id !== MODEL || !model.files.some((f) => f.name === "config.json")) fail(`unexpected model: ${info.out}`)
  console.log(`PASS model_info files=${model.file_count} pipeline=${model.pipeline_tag}`)

  const listed = await call(5, "list_files", { repo: MODEL, limit: 50 })
  if (listed.result?.isError) fail(`list_files failed: ${listed.out}`)
  const files = JSON.parse(listed.out)
  if (!files.entries.some((f) => f.path === "config.json")) fail(`config.json missing: ${listed.out}`)
  console.log(`PASS list_files count=${files.count}`)

  const card = await call(6, "read_card", { repo: CARD_MODEL, max_chars: 50000 })
  if (card.result?.isError) fail(`read_card failed: ${card.out}`)
  const cardData = JSON.parse(card.out)
  if (!cardData.text.toLowerCase().includes("bert")) fail(`card did not look like BERT: ${card.out.slice(0, 300)}`)
  console.log(`PASS read_card chars=${cardData.chars}`)

  const datasets = await call(7, "search_datasets", { query: "imdb", limit: 5 })
  if (datasets.result?.isError) fail(`search_datasets failed: ${datasets.out}`)
  const datasetSearch = JSON.parse(datasets.out)
  if (!datasetSearch.datasets.some((d) => d.id?.includes("imdb"))) fail(`unexpected datasets: ${datasets.out}`)
  console.log(`PASS search_datasets count=${datasetSearch.count}`)

  const dataset = await call(8, "dataset_info", { repo: "imdb" })
  if (dataset.result?.isError) fail(`dataset_info failed: ${dataset.out}`)
  const datasetData = JSON.parse(dataset.out)
  if (!String(datasetData.id).endsWith("imdb")) fail(`unexpected dataset: ${dataset.out}`)
  console.log(`PASS dataset_info files=${datasetData.file_count}`)

  const bad = await call(9, "model_info", { repo: "../etc" })
  if (!bad.result?.isError) fail("bad repo id was not rejected")
  console.log("PASS bad repo rejected")

  const missing = await call(10, "model_info", { repo: "mrfentmen/definitely-not-a-real-model-xyz" })
  if (!missing.result?.isError) fail("missing model did not return an error")
  console.log("PASS missing model returns an error")

  child.kill()
  process.exit(0)
} catch (e) {
  fail(e.message)
}
