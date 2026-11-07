/**
 * Live smoke test: real files, real DuckDB, real stdio MCP calls.
 */
import { spawn } from "node:child_process"
import { mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import duckdb from "duckdb"

const dir = mkdtempSync(path.join(tmpdir(), "duckdb-mcp-test-"))
const csv = path.join(dir, "people.csv")
const json = path.join(dir, "scores.json")
const parquet = path.join(dir, "people.parquet")

writeFileSync(csv, "name,score\nAlice,10\nBob,7\nCara,9\n")
writeFileSync(json, JSON.stringify([{ team: "red", points: 3 }, { team: "blue", points: 5 }]))
await new Promise((resolve, reject) => {
  const database = new duckdb.Database(":memory:")
  database.run(`COPY (SELECT * FROM read_csv_auto('${csv}')) TO '${parquet}' (FORMAT PARQUET)`, (err) =>
    err ? reject(err) : resolve()
  )
})
if (!existsSync(parquet)) throw new Error("failed to create test parquet")

const child = spawn(process.execPath, ["dist/index.js"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, DUCKDB_MCP_ALLOWED_DIRS: dir },
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
    const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 30000)
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

function cleanup() {
  child.kill()
  rmSync(dir, { recursive: true, force: true })
}

const fail = (msg) => {
  console.error(`FAIL ${msg}`)
  console.error(stderr.trim())
  cleanup()
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
  for (const wanted of ["inspect_file", "list_files", "query"]) {
    if (!names.includes(wanted)) fail(`tools/list is missing ${wanted} (got: ${names.join(", ")})`)
  }
  console.log(`PASS tools=${names.length} [${names.join(", ")}]`)

  const csvQuery = await call(3, "query", {
    sql: `SELECT name, score FROM read_csv_auto('${csv}') ORDER BY score DESC`,
  })
  if (csvQuery.result?.isError) fail(`query failed: ${csvQuery.out}`)
  const csvData = JSON.parse(csvQuery.out)
  if (csvData.rows[0].name !== "Alice" || String(csvData.rows[0].score) !== "10") {
    fail(`unexpected CSV rows: ${csvQuery.out}`)
  }
  if (csvData.row_count !== 3) fail(`expected 3 CSV rows, got ${csvData.row_count}`)
  console.log(`PASS query csv rows=${csvData.row_count} columns=${csvData.columns.join(",")}`)

  const parquetQuery = await call(4, "query", {
    sql: `SELECT count(*) AS n FROM read_parquet('${parquet}')`,
  })
  const parquetData = JSON.parse(parquetQuery.out)
  const count = Number(parquetData.rows[0].n)
  if (count !== 3) fail(`expected 3 parquet rows, got ${parquetQuery.out}`)
  console.log(`PASS query parquet rows=${count}`)

  const jsonQuery = await call(5, "query", {
    sql: `SELECT team, points FROM read_json_auto('${json}') ORDER BY points DESC LIMIT 1`,
  })
  const jsonData = JSON.parse(jsonQuery.out)
  if (jsonData.rows[0].team !== "blue") fail(`unexpected JSON row: ${jsonQuery.out}`)
  console.log(`PASS query json top=${jsonData.rows[0].team}`)

  const inspected = await call(6, "inspect_file", { path: csv })
  const info = JSON.parse(inspected.out)
  if (info.format !== "csv" || info.columns.length !== 2) fail(`unexpected inspect_file: ${inspected.out}`)
  if (!info.columns.some((c) => c.name === "score" && c.type === "BIGINT")) {
    fail(`unexpected column types: ${JSON.stringify(info.columns)}`)
  }
  console.log(`PASS inspect_file columns=${info.columns.map((c) => `${c.name}:${c.type}`).join(",")}`)

  const listed = await call(7, "list_files", { directory: dir, recursive: true })
  const files = JSON.parse(listed.out)
  if (files.count !== 3) fail(`expected 3 files, got ${listed.out}`)
  console.log(`PASS list_files count=${files.count}`)

  const capped = await call(8, "query", { sql: `SELECT * FROM read_csv_auto('${csv}')`, limit: 2 })
  const cappedData = JSON.parse(capped.out)
  if (!cappedData.truncated || cappedData.rows.length !== 2) fail(`limit was not enforced: ${capped.out}`)
  console.log("PASS limit caps rows")

  const write = await call(9, "query", { sql: "CREATE TABLE nasty (i INT)" })
  if (!write.result?.isError) fail("CREATE TABLE was not rejected")
  console.log("PASS write SQL rejected")

  const multi = await call(10, "query", { sql: "SELECT 1; DROP TABLE nasty" })
  if (!multi.result?.isError) fail("multiple statements were not rejected")
  console.log("PASS multiple statements rejected")

  const outside = await call(11, "inspect_file", { path: "/etc/hosts" })
  if (!outside.result?.isError) fail("path outside the allowed roots was not rejected")
  console.log("PASS outside path rejected")

  const sqlOutside = await call(12, "query", { sql: "SELECT * FROM read_csv_auto('/etc/hosts')" })
  if (!sqlOutside.result?.isError) fail("SQL read outside the allowed roots was not rejected")
  console.log("PASS SQL outside path rejected")

  cleanup()
  process.exit(0)
} catch (e) {
  fail(e.message)
}
