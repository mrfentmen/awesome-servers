import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { analyzeHistory } from "./dist/history.js"

const root = await mkdtemp(path.join(os.tmpdir(), "flaky-history-test-"))
try {
  await mkdir(path.join(root, "reports"))
  await writeFile(path.join(root, "reports", "runs.jsonl"), '{"status":"passed"}\n{"status":"not ok"}\n{"status":"skipped"}\n')
  await writeFile(path.join(root, "reports", "junit.xml"), "<testsuite><testcase><failure/></testcase><testcase><error/></testcase><testcase><skipped/></testcase><testcase/></testsuite>")
  process.env.FLAKY_HISTORY_ROOT = path.dirname(root)
  const report = await analyzeHistory(path.basename(root))
  assert.equal(report.totalObservations, 7)
  assert.deepEqual(report.totals, { passed: 2, failed: 3, skipped: 2, unknown: 0 })
  assert.equal(report.instabilitySignal, "mixed-outcomes-observed")
  assert.equal(report.root, "<local-project>")
} finally {
  await rm(root, { recursive: true, force: true })
}
console.log("FLAKY HISTORY PARSER TEST PASSED")
