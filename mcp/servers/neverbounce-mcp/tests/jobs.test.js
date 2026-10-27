import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  jobsCreatePayload,
  poeConfirmPayload,
  classifyCheck,
  resultsTally,
} from '../dist/util.js';

test('jobsCreatePayload takes exactly one list source', () => {
  const got = jobsCreatePayload('k', { email_list_folder: ' my-lists ', auto_parse: false });
  assert.deepEqual(got, { key: 'k', email_list_folder: 'my-lists', auto_parse: false });

  const defaults = jobsCreatePayload('k', { email_filename: 'list.csv' });
  assert.equal(defaults.auto_parse, true);

  assert.throws(
    () => jobsCreatePayload('k', { email_filename: 'a', email_list_folder: 'b' }),
    /exactly one of email_filename or email_list_folder/,
  );
  assert.throws(
    () => jobsCreatePayload('k', {}),
    /exactly one of email_filename or email_list_folder/,
  );

  const named = jobsCreatePayload('k', { email_filename: 'a.csv', job_name: ' spring clean ' });
  assert.equal(named.job_name, 'spring clean');

  const sampled = jobsCreatePayload('k', { email_filename: 'a.csv', run_sample: true });
  assert.equal(sampled.run_sample, true);
});

test('poeConfirmPayload requires both halves of the proof', () => {
  assert.deepEqual(poeConfirmPayload('k', ' tx-1 ', ' tok-1 '), {
    key: 'k',
    transaction_id: 'tx-1',
    token: 'tok-1',
  });
  assert.throws(() => poeConfirmPayload('k', '', 'tok'), /transaction_id and token are both required/);
  assert.throws(() => poeConfirmPayload('k', 'tx', undefined), /transaction_id and token are both required/);
});

test('classifyCheck maps results to send/dont-send verdicts', () => {
  assert.deepEqual(classifyCheck('valid', undefined), {
    verdict: 'safe',
    reason: 'mailbox verified deliverable',
  });
  assert.deepEqual(classifyCheck('catchall', undefined).verdict, 'risky');
  assert.deepEqual(classifyCheck('disposable', undefined).verdict, 'risky');
  assert.deepEqual(classifyCheck('invalid', undefined).verdict, 'dead');
  assert.deepEqual(classifyCheck('unknown', undefined).verdict, 'unknown');
  assert.deepEqual(classifyCheck(undefined, undefined).verdict, 'unknown');
  // spamtrap outranks an otherwise valid answer
  assert.deepEqual(classifyCheck('valid', { spamtrap: true }).verdict, 'dead');
});

test('resultsTally counts one page honestly', () => {
  const data = {
    results: [
      { email: 'a@x.com', verification: { result: 'valid' } },
      { email: 'b@x.com', verification: { result: 'valid' } },
      { email: 'c@x.com', verification: { result: 'invalid' } },
      { email: 'd@x.com', verification: {} },
    ],
  };
  assert.deepEqual(resultsTally(data), { tally: { valid: 2, invalid: 1, unknown: 1 }, counted: 4 });
  assert.deepEqual(resultsTally({}), { tally: {}, counted: 0 });
});