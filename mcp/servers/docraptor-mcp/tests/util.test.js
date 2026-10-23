import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDocsPayload, slugifyName, outputFileName, BASE64_RETURN_LIMIT } from '../dist/util.js';

test('slugifyName keeps a readable file stem', () => {
  assert.equal(slugifyName('Monthly Invoice #12 (April)'), 'monthly-invoice-12-april');
  assert.equal(slugifyName('   '), 'document');
  assert.equal(slugifyName('!!!'), 'document');
});

test('outputFileName follows the requested type', () => {
  assert.equal(outputFileName('Report A', 'pdf'), 'report-a.pdf');
  assert.equal(outputFileName('Report A', 'xlsx'), 'report-a.xlsx');
});

test('buildDocsPayload defaults to test mode and keeps one source only', () => {
  const got = buildDocsPayload({
    name: 'Hello',
    type: 'pdf',
    documentContent: '<h1>hi</h1>',
  });
  assert.deepEqual(got, { type: 'pdf', name: 'Hello', test: true, document_content: '<h1>hi</h1>' });

  const byUrl = buildDocsPayload({ name: 'Hello', type: 'pdf', documentUrl: ' https://example.com ' });
  assert.equal(byUrl.document_url, 'https://example.com');
  assert.equal(byUrl.test, true);
});

test('buildDocsPayload rejects missing name, bad type and double sources', () => {
  assert.throws(() => buildDocsPayload({ name: ' ', type: 'pdf', documentContent: 'x' }), /name is required/);
  assert.throws(
    () => buildDocsPayload({ name: 'x', type: 'docx' as never, documentContent: 'x' }),
    /type must be "pdf" or "xlsx"/,
  );
  assert.throws(
    () => buildDocsPayload({ name: 'x', type: 'pdf' }),
    /exactly one of document_content or document_url/,
  );
  assert.throws(
    () => buildDocsPayload({ name: 'x', type: 'pdf', documentContent: 'a', documentUrl: 'b' }),
    /exactly one of document_content or document_url/,
  );
});

test('buildDocsPayload validates prince options and includes them only when set', () => {
  const full = buildDocsPayload({
    name: 'x',
    type: 'pdf',
    documentContent: 'x',
    test: false,
    baseUrl: 'https://cdn.example',
    httpTimeout: 20,
    insecure: true,
    javascript: true,
  });
  assert.deepEqual(full.prince_options, {
    baseurl: 'https://cdn.example',
    http_timeout: 20,
    insecure: true,
    javascript: true,
  });
  assert.equal(full.test, false);

  const plain = buildDocsPayload({ name: 'x', type: 'pdf', documentContent: 'x' });
  assert.equal('prince_options' in plain, false);

  assert.throws(
    () => buildDocsPayload({ name: 'x', type: 'pdf', documentContent: 'x', httpTimeout: 90 }),
    /between 1 and 60/,
  );
});

test('BASE64_RETURN_LIMIT is the documented 1 MB line', () => {
  assert.equal(BASE64_RETURN_LIMIT, 1_000_000);
});
