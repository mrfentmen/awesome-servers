import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const load = (f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));

test('meta names the language and records its source commit', () => {
  const meta = load('meta.json');
  assert.ok(meta.language, 'meta.language missing');
  assert.ok(meta.repo.startsWith('https://github.com/aardappel/'), 'meta.repo must point at the upstream repo');
  assert.match(meta.commit, /^[0-9a-f]{40}$/, 'meta.commit must be a full git sha');
  assert.ok(meta.docs > 20, `expected >20 doc sections, got ${meta.docs}`);
});

test('docs contain real extracted sections', () => {
  const docs = load('docs.json');
  assert.ok(docs.length > 20, `expected >20 sections, got ${docs.length}`);
  const ids = new Set();
  for (const d of docs) {
    assert.ok(d.id && !ids.has(d.id), `bad or duplicate section id: ${d.id}`);
    ids.add(d.id);
    assert.ok(d.title && d.title.length > 0, `${d.id} has no title`);
    assert.ok(d.text && d.text.length > 100, `${d.id} body too short`);
    assert.ok(d.doc && d.docTitle, `${d.id} missing doc metadata`);
  }
});

test('reference dataset is populated and well formed', () => {
  const items = load('symbols.json');
  assert.ok(items.length > 100, `expected >100 entries, got ${items.length}`);
  for (const it of items) {
    assert.ok(it.name && /^[A-Za-z_][A-Za-z0-9_.]*$/.test(it.name), `bad name: ${it.name}`);
    assert.ok(typeof it.signature === 'string' && it.signature.length > 0, `${it.name} has no signature`);
  }
});

test('keywords include a known word of the language', () => {
  const kws = load('keywords.json');
  const words = kws.map((k) => k.word);
  assert.ok(words.includes('let'), 'expected "let" in the keyword list');
  assert.ok(words.length > 20, `expected >20 keywords, got ${words.length}`);
});

test('samples carry real source code', () => {
  const samples = load('samples.json');
  assert.ok(samples.length >= 15, `expected >=15 samples, got ${samples.length}`);
  for (const s of samples) {
    assert.ok(s.name && s.path, 'sample needs a name and path');
    assert.ok(typeof s.code === 'string' && s.code.length > 100, `${s.name} has too little code`);
  }
});
