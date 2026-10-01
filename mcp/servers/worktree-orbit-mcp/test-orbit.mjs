import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { inspectTopology, parseWorktreePorcelain } from "./dist/orbit.js"

const parsed = parseWorktreePorcelain("worktree /safe/one\nHEAD abc\nbranch refs/heads/main\n\nworktree /safe/two\nlocked maintenance\nprunable stale\ndetached\n")
assert.equal(parsed.length, 2)
assert.equal(parsed[1].locked, true)
assert.equal(parsed[1].prunable, true)
assert.equal(parsed[1].detached, true)

const root = await mkdtemp(path.join(os.tmpdir(), "worktree-orbit-test-"))
process.env.WORKTREE_ORBIT_ROOT = root
const run = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8" })
try {
  const repo = path.join(root, "repo")
  const child = path.join(root, "child")
  await mkdir(repo)
  run(["init", "-q"], repo)
  run(["config", "user.email", "test@example.invalid"], repo)
  run(["config", "user.name", "Test"], repo)
  await writeFile(path.join(repo, "private.txt"), "PRIVATE_CONTENT")
  run(["add", "private.txt"], repo)
  run(["commit", "-qm", "PRIVATE_SUBJECT"], repo)
  run(["worktree", "add", "-q", "-b", "private-branch", child], repo)
  const result = await inspectTopology("repo")
  const output = JSON.stringify(result)
  assert.equal(result.worktreeCount, 2)
  assert.equal(result.linkedCount, 1)
  assert.equal(result.namedBranchCount, 2)
  assert.equal(result.valueFree, true)
  for (const secret of ["PRIVATE_CONTENT", "PRIVATE_SUBJECT", "private-branch", repo, child]) assert.equal(output.includes(secret), false, `leaked ${secret}`)
  await assert.rejects(() => inspectTopology("/etc"), /inside the configured local workspace/)
  await assert.rejects(() => inspectTopology("missing"), /Git topology could not be read|Git work tree|unavailable/)
} finally {
  await rm(root, { recursive: true, force: true })
}
console.log("WORKTREE ORBIT TEST PASSED")
