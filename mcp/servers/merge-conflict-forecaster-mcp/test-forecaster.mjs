import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { parseBranchRows, parseNameStatus, forecast } from "./dist/forecaster.js"

const parsedBranches = parseBranchRows("main\t\t0\t0\nfeature\torigin/main\t2\t1\n")
assert.equal(parsedBranches.length, 2)
assert.equal(parsedBranches[1].ahead, 2)
assert.equal(parsedBranches[1].behind, 1)
assert.deepEqual(parseNameStatus("M\talpha.ts\nR100\told.ts\n"), ["alpha.ts", "old.ts"])

const root = await mkdtemp(path.join(os.tmpdir(), "merge-forecast-root-"))
process.env.MERGE_CONFLICT_FORECASTER_ROOT = root
const run = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8" })
try {
  const repository = path.join(root, "repository")
  await mkdir(repository)
  run(["init", "-q"], repository)
  run(["config", "user.email", "test@example.invalid"], repository)
  run(["config", "user.name", "Private Person"], repository)
  await writeFile(path.join(repository, "shared.txt"), "base\n")
  await writeFile(path.join(repository, "private.txt"), "PRIVATE_CONTENT\n")
  run(["add", "."], repository)
  run(["commit", "-qm", "PRIVATE_SUBJECT"], repository)
  run(["switch", "-q", "-c", "feature-one"], repository)
  await writeFile(path.join(repository, "shared.txt"), "feature one\n")
  run(["add", "shared.txt"], repository)
  run(["commit", "-qm", "feature one private message"], repository)
  run(["switch", "-q", "main"], repository)
  run(["switch", "-q", "-c", "feature-two"], repository)
  await writeFile(path.join(repository, "shared.txt"), "feature two\n")
  run(["add", "shared.txt"], repository)
  run(["commit", "-qm", "feature two private message"], repository)
  run(["switch", "-q", "main"], repository)

  const result = await forecast({ cwd: "repository", base: "main", limit: 10 })
  const output = JSON.stringify(result)
  assert.equal(result.currentBranchPresent, true)
  assert.equal(result.analyzedBranchCount, 2)
  assert.equal(result.overlappingFileCount, 1)
  assert.equal(result.mediumPressureOverlapCount, 0)
  assert.equal(result.lowPressureOverlapCount, 1)
  assert.equal(result.forecast, "low-overlap-pressure")
  assert.equal(result.valueFree, true)
  assert.equal(result.baseResolved, "current-branch")
  assert.equal(result.branchPressure.every((branch) => branch.pressure === "low"), true)
  const limited = await forecast({ cwd: "repository", base: "main", limit: 1 })
  assert.equal(limited.analyzedBranchCount, 1)
  run(["checkout", "-q", "--detach", "HEAD"], repository)
  const detached = await forecast({ cwd: "repository", limit: 1 })
  assert.equal(detached.baseResolved, "detached-head")
  for (const secret of ["PRIVATE_CONTENT", "PRIVATE_SUBJECT", "feature one private message", "shared.txt", "feature-one", repository]) assert.equal(output.includes(secret), false, `leaked ${secret}`)
  await assert.rejects(() => forecast({ cwd: "repository", base: "missing-branch" }), /selected base must be an existing local branch/)
  await assert.rejects(() => forecast({ cwd: "/etc" }), /inside the configured local workspace/)
  await assert.rejects(() => forecast({ cwd: "missing" }), /Local Git analysis failed|Git work tree|unavailable/)
  await assert.rejects(() => forecast({ cwd: "repository", base: "--help" }), /selected base must be an existing local branch/)
} finally {
  await rm(root, { recursive: true, force: true })
}
console.log("MERGE CONFLICT FORECASTER TEST PASSED")
