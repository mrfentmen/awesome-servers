import assert from "node:assert/strict"
import { writeFile, rm, mkdtemp } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import os from "node:os"
import path from "node:path"
import { summarizeReleaseHistory } from "./dist/core.js"

const run = promisify(execFile)
const root = await mkdtemp(path.join(os.tmpdir(), "release-forge-root-"))
const repository = path.join(root, "repository")
await run("git", ["init", "-q", repository])
await run("git", ["-C", repository, "config", "user.email", "test@example.invalid"])
await run("git", ["-C", repository, "config", "user.name", "Private Person"])
await writeFile(path.join(repository, "secret.txt"), "PRIVATE")
await run("git", ["-C", repository, "add", "."])
await run("git", ["-C", repository, "commit", "-qm", "feat: private message"])
process.env.RELEASE_NOTES_ROOT = root
try {
  const report = await summarizeReleaseHistory({ cwd: "repository" })
  assert.equal(report.commitCount, 1)
  assert.equal(report.valueFree, true)
  assert.equal(JSON.stringify(report).includes("private"), false)
} finally { await rm(root, { recursive: true, force: true }) }
console.log("RELEASE NOTES FORGE TEST PASSED")
