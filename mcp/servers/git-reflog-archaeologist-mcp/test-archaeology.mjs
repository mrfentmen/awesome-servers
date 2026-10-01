import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { reflogSignals, recoverySignals, stashSignals } from "./dist/archaeology.js"
const root = await mkdtemp(path.join(os.tmpdir(), "git-archaeology-test-"))
process.env.GIT_ARCHAEOLOGY_ROOT = root
try {
  await mkdir(path.join(root, "repo"))
  await writeFile(path.join(root, "repo", "marker"), "not a git repository")
  await assert.rejects(() => reflogSignals("repo"), /not a Git work tree|metadata could not be read/)
  await assert.rejects(() => recoverySignals("/etc"), /inside the configured local workspace/)
  await assert.rejects(() => stashSignals("/etc"), /inside the configured local workspace/)
} finally { await rm(root, { recursive: true, force: true }) }
console.log("GIT ARCHAEOLOGY TEST PASSED")
