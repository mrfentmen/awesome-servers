import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validateTimeout,
  validatePageArgs,
  validateJobId,
  singleCheckPayload,
  shapeSingleCheck,
  shapeAccountInfo,
} from '../dist/util.js';

test('validateEmail trims and rejects junk', () => {
  assert.equal(validateEmail('  a@b.co '), 'a@b.co');
  assert.throws(() => validateEmail('not-an-email'), /not a plausible email/);
  assert.throws(() => validateEmail('a@b'), /not a plausible email/);
});

test('validateTimeout defaults to 30 and bounds 3..30', () => {
  assert.equal(validateTimeout(undefined), 30);
  assert.equal(validateTimeout(10), 10);
  assert.throws(() => validateTimeout(2), /between 3 and 30/);
  assert.throws(() => validateTimeout(31), /between 3 and 30/);
  assert.throws(() => validateTimeout(4.5), /between 3 and 30/);
});

test('validatePageArgs keeps only given keys and bounds items', () => {
  assert.deepEqual(validatePageArgs(undefined, undefined), {});
  assert.deepEqual(validatePageArgs(2, 100), { start_page: 2, items_per_page: 100 });
  assert.throws(() => validatePageArgs(0, undefined), /positive integer/);
  assert.throws(() => validatePageArgs(undefined, 501), /between 1 and 500/);
});

test('validateJobId rejects empty ids', () => {
  assert.equal(validateJobId('  abc123 '), 'abc123');
  assert.throws(() => validateJobId(''), /job_id is required/);
  assert.throws(() => validateJobId(undefined), /job_id is required/);
});

test('singleCheckPayload packs key, email and timeout', () => {
  assert.deepEqual(singleCheckPayload('k', 'A@B.co'), { key: 'k', email: 'A@B.co', timeout: 30 });
  assert.deepEqual(singleCheckPayload('k', 'A@B.co', 5), { key: 'k', email: 'A@B.co', timeout: 5 });
});

test('shapeSingleCheck unwraps the vendor envelope and errors loudly', () => {
  const got = shapeSingleCheck('single/check', {
    status: 'success',
    result: 'valid',
    flags: { free_email_provider: true },
    suggested_correction: null,
    execution_time: 123,
  });
  assert.deepEqual(got, {
    result: 'valid',
    flags: { free_email_provider: true },
    suggested_correction: null,
    execution_time: 123,
  });

  assert.throws(
    () => shapeSingleCheck('single/check', { status: 'error', message: 'bad key' }),
    /status=error bad key/,
  );
  assert.throws(
    () => shapeSingleCheck('single/check', { status: 'success' }),
    undefined,
  );
});

test('shapeAccountInfo keeps credit fields', () => {
  const got = shapeAccountInfo('account/info', {
    status: 'success',
    credits: 15000,
    monthly_usage: { total_credits_used: 10 },
    monthly_limit: 100000,
  });
  assert.equal(got.credits, 15000);
  assert.equal(got.monthly_limit, 100000);
  assert.throws(
    () => shapeAccountInfo('account/info', { status: 'error', message: 'x' }),
    /account\/info error/,
  );
});
