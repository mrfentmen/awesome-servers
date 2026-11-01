import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const load = (f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));

test('meta names the language and records a source commit', () => {
  const meta = load('meta.json');
  assert.ok(meta.language, 'meta.language missing');
  assert.match(meta.repo, /^https:\/\/github\.com\//, 'meta.repo must be a github url');
  assert.match(meta.commit, /^[0-9a-f]{40}$/, 'meta.commit must be a full git sha');
  assert.ok(meta.docs > 20, 'expected >20 doc sections, got ' + meta.docs);
});

test('docs are real extracted sections', () => {
  const docs = load('docs.json');
  assert.ok(docs.length > 20, 'expected >20 sections, got ' + docs.length);
  const ids = new Set();
  for (const d of docs) {
    assert.ok(d.id && !ids.has(d.id), 'bad or duplicate section id: ' + d.id);
    ids.add(d.id);
    assert.ok(d.title && d.title.length > 0, d.id + ' has no title');
    assert.ok(d.text && d.text.length > 100, d.id + ' body too short');
    assert.ok(d.doc && d.docTitle, d.id + ' missing doc metadata');
  }
});

test('symbols are populated and well formed', () => {
  const items = load('symbols.json');
  assert.ok(items.length >= 30, 'expected >=30 symbols, got ' + items.length);
  for (const it of items) {
    assert.ok(it.name && /^[A-Za-z_][A-Za-z0-9_.\-]*$/.test(it.name), 'bad name: ' + it.name);
    assert.ok(typeof it.signature === 'string' && it.signature.length > 0, it.name + ' has no signature');
    assert.ok(typeof it.module === 'string' && it.module.length > 0, it.name + ' has no module');
  }
});

test('every sample carries real source code', () => {
  const samples = load('samples.json');
  const meta = load('meta.json');
  assert.equal(samples.length, meta.samples, 'sample count mismatch with meta');
  for (const s of samples) {
    assert.ok(s.name && s.path, 'sample needs a name and path');
    assert.ok(typeof s.code === 'string' && s.code.length > 100, s.name + ' has too little code');
  }
});
