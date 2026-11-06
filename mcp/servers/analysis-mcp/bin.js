#!/usr/bin/env node
// Cross-platform launcher: runs the bundled Python MCP server over stdio.
import { spawn, spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const server = path.join(here, "src", "analysis_mcp.py")

const candidates = process.env.PYTHON
  ? [process.env.PYTHON]
  : process.platform === "win32"
    ? ["python", "python3"]
    : ["python3", "python"]

let py = null
for (const cmd of candidates) {
  const r = spawnSync(cmd, ["--version"], { stdio: "ignore" })
  if (r.status === 0) {
    py = cmd
    break
  }
}
if (!py) {
  console.error("analysis-mcp needs python3 on PATH (or set PYTHON=...).")
  process.exit(1)
}

const child = spawn(py, [server], { stdio: "inherit" })
child.on("exit", (code, signal) => {
  if (signal) console.error(`analysis-mcp: python exited on ${signal}`)
  process.exitCode = code === 0 ? 0 : (code ?? 1)
})
