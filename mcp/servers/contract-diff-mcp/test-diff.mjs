import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { compareSnapshots } from "./dist/diff.js"

const root = await mkdtemp(path.join(os.tmpdir(), "contract-diff-test-"))
process.env.CONTRACT_DIFF_ROOT = root
try {
  await mkdir(path.join(root, "snapshots"))
  await writeFile(path.join(root, "snapshots", "before.json"), JSON.stringify({
    info: { title: "PRIVATE TITLE", version: "1.2.3" },
    paths: { "/private": { get: { description: "PRIVATE DESCRIPTION", example: "secret-value" } } },
  }))
  await writeFile(path.join(root, "snapshots", "after.json"), JSON.stringify({
    info: { title: "PRIVATE TITLE", version: "9.9.9" },
    paths: { "/private": { get: { description: "CHANGED DESCRIPTION", example: "new-secret-value" } }, "/new": { post: {} } },
  }))

  const result = await compareSnapshots("snapshots/before.json", "snapshots/after.json")
  const output = JSON.stringify(result)
  assert.equal(result.valueFree, true)
  assert.equal(result.changedShape, true)
  assert.match(output, /beforeNodeCount/)
  assert.match(output, /categories/)
  for (const secret of ["PRIVATE TITLE", "1.2.3", "9.9.9", "PRIVATE DESCRIPTION", "CHANGED DESCRIPTION", "secret-value", "new-secret-value", "/private", "/new"]) {
    assert.equal(output.includes(secret), false, `private value leaked: ${secret}`)
  }

  await assert.rejects(() => compareSnapshots("/etc/hosts", "snapshots/after.json"), /inside the configured local workspace/)
} finally {
  await rm(root, { recursive: true, force: true })
}
console.log("CONTRACT DIFF TEST PASSED")
