import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidIp,
  validateLookupIp,
  validateBulkIps,
  buildLookupUrl,
  buildBulkUrl,
  pickFields,
  threatSummary,
  BULK_MAX,
} from '../dist/util.js';

test('isValidIp accepts IPv4', () => {
  assert.equal(isValidIp('8.8.8.8'), true);
  assert.equal(isValidIp('192.168.1.1'), true);
  assert.equal(isValidIp('0.0.0.0'), true);
  assert.equal(isValidIp('255.255.255.255'), true);
});

test('isValidIp rejects bad IPv4', () => {
  assert.equal(isValidIp('256.1.1.1'), false);
  assert.equal(isValidIp('1.2.3'), false);
  assert.equal(isValidIp('a.b.c.d'), false);
  assert.equal(isValidIp(''), false);
  assert.equal(isValidIp('8.8.8.8/24'), false);
});

test('isValidIp accepts IPv6 including v4-mapped', () => {
  assert.equal(isValidIp('2001:4860:4860::8888'), true);
  assert.equal(isValidIp('::1'), true);
  assert.equal(isValidIp('::ffff:8.8.8.8'), true);
  assert.equal(isValidIp('fe80::1%eth0'), false); // zone ids are not part of the IP itself
});

test('validateLookupIp trims and rejects garbage', () => {
  assert.equal(validateLookupIp(' 8.8.8.8 '), '8.8.8.8');
  assert.throws(() => validateLookupIp('not-an-ip'), /not a valid IP address/);
});

test('validateBulkIps trims, dedupes and caps', () => {
  assert.deepEqual(validateBulkIps(['8.8.8.8', ' 8.8.8.8 ', '1.1.1.1']), ['8.8.8.8', '1.1.1.1']);
  assert.throws(() => validateBulkIps([]), /non-empty array/);
  assert.throws(() => validateBulkIps(['8.8.8.8', 'junk']), /not a valid IP address/);
  const tooMany = Array.from({ length: BULK_MAX + 1 }, () => `10.0.0.${1 + 0}`.replace('.1', String(1)));
  void tooMany;
  const many = Array.from({ length: BULK_MAX + 1 }, (_, i) => `10.${i}.0.1`);
  assert.throws(() => validateBulkIps(many), /at most 50/);
});

test('buildLookupUrl builds host, path and encoded key', () => {
  assert.equal(
    buildLookupUrl('8.8.8.8', 'k/ey', false),
    'https://api.ipdata.co/8.8.8.8?api-key=k%2Fey',
  );
  assert.equal(
    buildLookupUrl(undefined, 'k', false),
    'https://api.ipdata.co?api-key=k',
  );
  assert.equal(
    buildLookupUrl('::1', 'k', true),
    'https://eu-api.ipdata.co/%3A%3A1?api-key=k',
  );
});

test('buildBulkUrl switches to the EU host when asked', () => {
  assert.equal(buildBulkUrl('k', false), 'https://api.ipdata.co/bulk?api-key=k');
  assert.equal(buildBulkUrl('k', true), 'https://eu-api.ipdata.co/bulk?api-key=k');
});

test('pickFields keeps the asked fields and passes everything when unset', () => {
  const data = { ip: '8.8.8.8', threat: { is_tor: false }, asn: { asn: 15169 } };
  assert.deepEqual(pickFields(data, ['ip', 'threat']), { ip: '8.8.8.8', threat: { is_tor: false } });
  assert.deepEqual(pickFields(data, ['nope']), {});
  assert.deepEqual(pickFields(data, undefined), data);
});

test('threatSummary packs the triage fields and tolerates missing blocks', () => {
  const got = threatSummary({
    ip: '8.8.8.8',
    city: 'Mountain View',
    region: 'California',
    country_name: 'United States',
    country_code: 'US',
    time_zone: { name: 'America/Los_Angeles' },
    threat: { is_tor: false, is_proxy: false },
    asn: { asn: 'AS15169', name: 'Google LLC' },
  });
  assert.equal(got.ip, '8.8.8.8');
  assert.deepEqual(got.location, {
    city: 'Mountain View',
    region: 'California',
    country_name: 'United States',
    country_code: 'US',
    time_zone: 'America/Los_Angeles',
  });
  assert.deepEqual(got.threat, { is_tor: false, is_proxy: false });

  const bare = threatSummary({ ip: '1.1.1.1' });
  assert.deepEqual(bare.threat, {});
  assert.deepEqual(bare.carrier, {});
});
