import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { scanSecretHygiene } from "./dist/core.js"

const root = await mkdtemp(path.join(os.tmpdir(), "secret-hygiene-"))
try {
  const project = path.join(root, "project")
  await mkdir(project)
  await writeFile(path.join(project, ".env.local"), "TOKEN=PRIVATE_SECRET_VALUE")
  process.env.SECRET_HYGIENE_ROOT = root
  const report = await scanSecretHygiene({ project: "project" })
  assert.equal(report.filesScanned, 1)
  assert.equal(report.totalMatchCount, 1)
  assert.equal(JSON.stringify(report).includes("PRIVATE_SECRET_VALUE"), false)
} finally { await rm(root, { recursive: true, force: true }) }
console.log("SECRET HYGIENE TEST PASSED")
