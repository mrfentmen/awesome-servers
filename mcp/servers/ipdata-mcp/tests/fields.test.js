import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIELD_SETS, bulkCountryRows } from '../dist/util.js';

test('every field set is non-empty and starts with the ip field', () => {
  for (const [name, fields] of Object.entries(FIELD_SETS)) {
    assert.ok(fields.length > 0, `${name} set is empty`);
    assert.equal(fields[0], 'ip', `${name} set must carry the ip field first`);
  }
});

test('the sliced sets cover the documented ipdata blocks', () => {
  assert.deepEqual(FIELD_SETS.timezone, ['ip', 'time_zone']);
  assert.deepEqual(FIELD_SETS.asn, ['ip', 'asn']);
  assert.ok(FIELD_SETS.location.length >= 10);
});

test('bulkCountryRows accepts a plain array and a {results} envelope', () => {
  const arr = bulkCountryRows([
    { ip: '8.8.8.8', country_code: 'US', threat: { is_tor: false } },
    { ip: '1.1.1.1' },
  ]);
  assert.equal(arr.length, 2);
  assert.deepEqual(arr[0], { ip: '8.8.8.8', country_code: 'US' });
  assert.equal(arr[1].ip, '1.1.1.1');
  assert.equal(arr[1].country_code, undefined);

  const wrapped = bulkCountryRows({ results: [{ ip: '2.2.2.2', country_code: 'DE' }] });
  assert.deepEqual(wrapped, [{ ip: '2.2.2.2', country_code: 'DE' }]);

  assert.throws(() => bulkCountryRows({ nope: true }), /unexpected bulk response shape/);
  assert.throws(() => bulkCountryRows('nope'), /unexpected bulk response shape/);
});