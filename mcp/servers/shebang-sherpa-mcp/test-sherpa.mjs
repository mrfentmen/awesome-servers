import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile, chmod } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { inspectScripts } from "./dist/sherpa.js"
const root = await mkdtemp(path.join(os.tmpdir(), "shebang-sherpa-test-"))
process.env.SHEBANG_SHERPA_ROOT = root
try { const project = path.join(root, "project"); await mkdir(project); await writeFile(path.join(project, "private.sh"), "#!/Users/private/bin/bash\nPRIVATE_COMMAND\n"); await writeFile(path.join(project, "python.py"), "#!/usr/bin/env python3\nPRIVATE_PYTHON\n"); await writeFile(path.join(project, ".env"), "PRIVATE_ENV=secret\n"); await writeFile(path.join(project, "credentials.key"), "PRIVATE_KEY\n"); await chmod(path.join(project, "python.py"), 0o644); const report = await inspectScripts("project"); const output = JSON.stringify(report); assert.equal(report.filesScanned, 2); assert.equal(report.shebangCount, 2); assert.equal(report.interpreterCategories.bash, 1); assert.equal(report.interpreterCategories.python, 1); assert.ok(report.portabilityWarnings["machine-specific-interpreter-path"] >= 1); assert.ok(report.portabilityWarnings["missing-executable-bit"] >= 1); assert.equal(report.valueFree, true); for (const secret of ["PRIVATE_COMMAND", "PRIVATE_PYTHON", "private.sh", "python.py", "Users/private"]) assert.equal(output.includes(secret), false, `leaked ${secret}`); await assert.rejects(() => inspectScripts("/etc"), /inside the configured local workspace/) } finally { await rm(root, { recursive: true, force: true }) }
console.log("SHEBANG SHERPA TEST PASSED")
