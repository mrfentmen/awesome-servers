import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ChempiricalError,
  searchMolecules,
  getMolecule,
  identifyStructure,
  resolveTerms,
  formatMolecule,
  formatSearch,
} from '../dist/api.js';

/** Replace global fetch with a stub that records the call. */
function stubFetch(handler) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const { status = 200, body = '', json } = await handler(String(url), init);
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => (json !== undefined ? JSON.stringify(json) : body),
    };
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

test('searchMolecules parses the results envelope', async () => {
  const { calls, restore } = stubFetch(() => ({
    json: {
      total: 2,
      capped: false,
      results: [
        { cas: '64-17-5', name: 'Ethanol', formula: 'C2H6O', molarMass: 46.069 },
        { cas: '141-43-5', name: 'Ethanolamine', formula: 'C2H7NO', molarMass: 61.084 },
      ],
    },
  }));
  try {
    const res = await searchMolecules('ethanol', 2, 0);
    assert.equal(res.results.length, 2);
    assert.equal(res.results[0].name, 'Ethanol');
    assert.equal(res.results[0].molarMass, 46.069);
    assert.match(calls[0].url, /\/api\/molecules\?/);
    assert.match(calls[0].url, /q=ethanol/);
    assert.match(calls[0].url, /limit=2/);
  } finally {
    restore();
  }
});

test('getMolecule maps the nested physical/property fields', async () => {
  const { restore } = stubFetch(() => ({
    json: {
      cas: '64-17-5',
      name: 'Ethanol',
      formula: 'C2H6O',
      properties: { molar_mass_g_per_mol: 46.069 },
      physical: { boilingPoint: { text: '78.5 °C' }, density: { text: '0.789 g/mL' } },
      identifiers: { smiles: 'CCO', inchiKey: 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N' },
    },
  }));
  try {
    const m = await getMolecule('64-17-5');
    assert.equal(m.name, 'Ethanol');
    assert.equal(m.molarMass, 46.069);
    assert.equal(m.boilingPoint, '78.5 °C');
    assert.equal(m.inchiKey, 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N');
  } finally {
    restore();
  }
});

test('identifyStructure reports stereo match and structure key', async () => {
  const { restore } = stubFetch(() => ({
    json: { match: { name: 'Ethanol', cas: '64-17-5' }, sameStereo: true, structureKey: 'abc123' },
  }));
  try {
    const r = await identifyStructure('CCO');
    assert.equal(r.name, 'Ethanol');
    assert.equal(r.sameStereo, true);
    assert.equal(r.structureKey, 'abc123');
  } finally {
    restore();
  }
});

test('resolveTerms POSTs terms as JSON with the required origin header', async () => {
  const { calls, restore } = stubFetch(() => ({
    json: {
      results: [
        { term: 'ethanol', compound: { name: 'Ethanol', cas: '64-17-5', formula: 'C2H6O' } },
      ],
    },
  }));
  try {
    const rows = await resolveTerms(['ethanol', '50-78-2']);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'Ethanol');
    assert.equal(calls[0].init.method, 'POST');
    const headers = calls[0].init.headers;
    assert.equal(headers.origin, 'https://chempirical.com');
    assert.deepEqual(JSON.parse(calls[0].init.body).terms, ['ethanol', '50-78-2']);
  } finally {
    restore();
  }
});

test('non-2xx responses throw ChempiricalError with the status', async () => {
  const { restore } = stubFetch(() => ({ status: 500, body: 'boom' }));
  try {
    await assert.rejects(() => getMolecule('00-00-0'), (err) => {
      assert.ok(err instanceof ChempiricalError);
      assert.match(err.message, /500/);
      return true;
    });
  } finally {
    restore();
  }
});

test('non-JSON bodies throw instead of returning garbage', async () => {
  const { restore } = stubFetch(() => ({ status: 200, body: '<html>not json</html>' }));
  try {
    await assert.rejects(() => getMolecule('64-17-5'), ChempiricalError);
  } finally {
    restore();
  }
});

test('formatters produce readable text', () => {
  const mol = formatMolecule({ name: 'Ethanol', cas: '64-17-5', formula: 'C2H6O', boilingPoint: '78.5 °C' });
  assert.match(mol, /Ethanol/);
  assert.match(mol, /64-17-5/);
  assert.match(mol, /78\.5/);

  const list = formatSearch({ results: [{ name: 'Ethanol', cas: '64-17-5' }], total: 1 });
  assert.match(list, /Ethanol/);
});

// Live network test: only runs when LIVE=1 is set, so CI stays offline.
test('LIVE: real API returns Ethanol for a search', { skip: process.env.LIVE !== '1' }, async () => {
  const res = await searchMolecules('ethanol', 3, 0);
  assert.ok(res.results.length > 0, 'expected at least one compound');
  const names = res.results.map((r) => r.name);
  assert.ok(names.includes('Ethanol'), `expected Ethanol, got ${names.join(', ')}`);
});
