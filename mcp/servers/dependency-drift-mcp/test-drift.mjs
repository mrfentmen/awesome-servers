import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { inspectDependencyDrift } from "./dist/drift.js"

const root = await mkdtemp(path.join(os.tmpdir(), "dependency-drift-test-"))
const project = path.join(root, "project")
await mkdir(project)
await writeFile(path.join(project, "package.json"), JSON.stringify({ name: "PRIVATE_PROJECT_NAME", dependencies: { "private-package": "^1.0.0", other: "^2.0.0" }, devDependencies: { test: "^3.0.0" }}))
await writeFile(path.join(project, "package-lock.json"), JSON.stringify({ lockfileVersion: 3, packages: { "": {}, "node_modules/private-package": { version: "1.2.0" }, "node_modules/other": { version: "2.1.0" } }}))
await writeFile(path.join(project, ".env"), "PRIVATE_SECRET=do-not-read-as-metadata\n")
process.env.DEPENDENCY_DRIFT_ROOT = root
try {
  const report = await inspectDependencyDrift("project")
  assert.equal(report.manifestCount, 1)
  assert.equal(report.lockfileCount, 1)
  assert.equal(report.declaredDependencyCount, 3)
  assert.equal(report.valueFree, true)
  const serialized = JSON.stringify(report)
  assert.equal(serialized.includes("PRIVATE_PROJECT_NAME"), false)
  assert.equal(serialized.includes("private-package"), false)
  assert.equal(serialized.includes("do-not-read"), false)
  await assert.rejects(() => inspectDependencyDrift("../outside"), /inside the configured root/)
} finally {
  await rm(root, { recursive: true, force: true })
}
console.log("DEPENDENCY DRIFT TEST PASSED")
