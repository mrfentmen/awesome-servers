import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { inspectMigrationMap } from "./dist/core.js"
const root = await mkdtemp(path.join(os.tmpdir(), "migration-map-"))
try {
  const project = path.join(root, "project")
  await mkdir(project)
  await writeFile(path.join(project, "001_create_private.sql"), "PRIVATE SQL")
  await writeFile(path.join(project, "001_down_private.sql"), "PRIVATE SQL")
  await writeFile(path.join(project, "003_add_private.sql"), "PRIVATE SQL")
  process.env.MIGRATION_MAP_ROOT = root
  const report = await inspectMigrationMap({ project: "project" })
  assert.equal(report.migrationCount, 3)
  assert.equal(report.gapCount, 1)
  assert.equal(report.pairedRollbackCount, 1)
  assert.equal(report.unpairedRollbackCount, 0)
  assert.equal(JSON.stringify(report).includes("private"), false)
} finally { await rm(root, { recursive: true, force: true }) }
console.log("MIGRATION MAP TEST PASSED")
