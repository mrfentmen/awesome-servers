import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LOBSTER, runProgram, checkToolchain } from '../dist/runner.js';

const ENV = 'LOBSTER_BIN';

async function stub(body) {
  const dir = await mkdtemp(join(tmpdir(), 'toolchain-stub-'));
  const bin = join(dir, 'stub');
  await writeFile(bin, `#!/usr/bin/env node\n${body}\n`, 'utf8');
  await chmod(bin, 0o755);
  return { bin, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

async function withBin(bin, fn) {
  const prev = process.env[ENV];
  process.env[ENV] = bin;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env[ENV];
    else process.env[ENV] = prev;
  }
}

test('missing toolchain fails with an error naming the env var', async () => {
  await withBin('/nonexistent/definitely-not-a-compiler', async () => {
    await assert.rejects(
      () => runProgram(LOBSTER, { code: 'x' }),
      (e) => {
        assert.match(e.message, new RegExp(ENV));
        assert.match(e.message, /https:\/\/github\.com\/aardappel\//);
        return true;
      }
    );
  });
});

test('runs the program and captures stdout, args and the temp file name', async () => {
  const s = await stub('console.log("STUB-OK", process.argv.slice(2).join(" "));');
  try {
    await withBin(s.bin, async () => {
      const r = await runProgram(LOBSTER, { code: 'print "hi"', args: ['one', 'two'] });
      assert.equal(r.exitCode, 0);
      assert.equal(r.timedOut, false);
      assert.match(r.stdout, /STUB-OK/);
      assert.match(r.stdout, /main\.lobster/);
      assert.match(r.stdout, /one two/);
      assert.equal(r.stderr, '');
    });
  } finally {
    await s.cleanup();
  }
});

test('captures stderr and a non-zero exit code', async () => {
  const s = await stub('console.error("boom"); process.exit(3);');
  try {
    await withBin(s.bin, async () => {
      const r = await runProgram(LOBSTER, { code: 'x' });
      assert.equal(r.exitCode, 3);
      assert.match(r.stderr, /boom/);
    });
  } finally {
    await s.cleanup();
  }
});

test('kills a program that runs past the timeout', async () => {
  const s = await stub('setTimeout(() => {}, 5000);');
  try {
    await withBin(s.bin, async () => {
      const r = await runProgram(LOBSTER, { code: 'x', timeoutMs: 300 });
      assert.equal(r.timedOut, true);
      assert.ok(r.durationMs < 4000, 'should not wait for the full program');
    });
  } finally {
    await s.cleanup();
  }
});

test('toolchain_status reports a missing binary instead of throwing', async () => {
  await withBin('/nonexistent/definitely-not-a-compiler', async () => {
    const st = checkToolchain(LOBSTER);
    assert.equal(st.found, false);
    assert.equal(st.origin, 'env');
    assert.match(st.detail, /github\.com/);
  });
});
