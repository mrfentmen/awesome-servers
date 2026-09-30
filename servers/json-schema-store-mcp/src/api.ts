const BASE = 'https://www.schemastore.org/api/json/catalog.json';

export interface SchemaEntry {
  name: string;
  description?: string;
  url?: string;
}

export interface SearchArgs {
  query: string;
  limit?: number;
}

async function listSchemas(): Promise<SchemaEntry[]> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-json-schema-store-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`schemastore catalog returned ${res.status}`);
  const data = (await res.json()) as { schemas?: SchemaEntry[] };
  return (data.schemas ?? []).slice(0, 500);
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim().toLowerCase();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 20, 50));
  const all = await listSchemas();
  const hits = all.filter((s) => `${s.name} ${s.description ?? ''}`.toLowerCase().includes(q)).slice(0, limit);
  if (!hits.length) return `No schemas in the store match "${q}".`;
  return `Schema Store matches for "${q}" (${hits.length} shown):\n` + hits.map((s, i) => `${i + 1}. ${s.name}\n   ${s.description ?? ''}`).join('\n');
}

// ---- muxE tools:
// The one existing tool takes a query, lowercases it, and looks for that
// substring inside name and description of the first 500 entries of a catalog
// that holds 1,496, so it both searches the wrong way and cannot reach more than
// a third of the store. The catalog carries two fields it never reads at all:
// fileMatch on 1,348 entries, which is how Schema Store is actually meant to be
// used, and versions on 171. Those two plus an honest census of the whole
// catalog are the three new tools.
const CATALOG = 'https://www.schemastore.org/api/json/catalog.json';
const UA_SS = 'mrfentmen-json-schema-store-mcp/1.0';

interface Entry {
  name?: string;
  description?: string;
  url?: string;
  fileMatch?: string[];
  versions?: Record<string, string>;
}

async function catalog(): Promise<Entry[]> {
  const res = await fetch(CATALOG, {
    headers: { 'User-Agent': UA_SS, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`schemastore catalog returned ${res.status}`);
  const data = (await res.json()) as { schemas?: Entry[] };
  const all = Array.isArray(data.schemas) ? data.schemas : [];
  if (!all.length) throw new Error('Schema Store returned an empty catalog.');
  return all;
}

const label = (v: unknown, max = 70): string => {
  if (typeof v !== 'string' || !v.trim()) return 'not reported';
  const t = v.trim();
  return t.length > max ? `${t.slice(0, max)}...` : t;
};

// A fileMatch pattern is a glob over a path. The subtlety that matters is that
// ** spans directories and may match none at all: the catalog writes patterns
// like **/.github/first-timers.yml, and a caller holding exactly that path has
// no leading directory, so **/ has to be able to match zero segments. A first
// attempt translated ** to .* and left the slash mandatory, which silently missed
// every such pattern.
function globToRegExp(pattern: string): RegExp {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        i += 1;
        if (pattern[i + 1] === '/') {
          i += 1;
          out += `(?:.*/)?`;
        } else {
          out += '.*';
        }
      } else {
        out += '[^/]*';
      }
      continue;
    }
    if (c === '?') { out += '[^/]'; continue; }
    // Everything else is literal, and the regex metacharacters have to be escaped.
    out += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${out}$`, 'i');
}

const basename = (p: string): string => {
  const parts = p.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? p;
};

export interface MatchFileArgs {
  path: string;
  limit?: number;
}

export interface SchemaVersionsArgs {
  name: string;
}

export async function schema_versions(args: SchemaVersionsArgs): Promise<string> {
  const q = (args?.name ?? '').trim();
  if (!q) return 'Provide the schema name as the store lists it, for example Ameba or GitHub Action.';
  const all = await catalog();
  const exact = all.filter((s) => (s.name ?? '').toLowerCase() === q.toLowerCase());
  const partial = exact.length ? exact : all.filter((s) => (s.name ?? '').toLowerCase().includes(q.toLowerCase()));
  if (!partial.length) return `No schema in the store is named like "${q}".`;
  if (!exact.length) {
    return [
      `No schema is named exactly "${q}", but ${partial.length} come close:`,
      ...partial.slice(0, 10).map((s, i) => `  ${i + 1}. ${s.name}`),
    ].join('\n');
  }
  const lines: string[] = [];
  for (const s of exact.slice(0, 10)) {
    lines.push(`Schema: ${s.name}`);
    lines.push(`  description: ${label(s.description, 100)}`);
    lines.push(`  current url: ${s.url ?? 'not reported'}`);
    if (Array.isArray(s.fileMatch) && s.fileMatch.length) {
      lines.push(`  claims these file names: ${s.fileMatch.slice(0, 8).join(', ')}${s.fileMatch.length > 8 ? `, and ${s.fileMatch.length - 8} more` : ''}.`);
    } else {
      lines.push('  claims no file names, so it can only be picked by name.');
    }
    const versions = s.versions;
    if (versions && typeof versions === 'object') {
      const entries = Object.entries(versions).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
      lines.push(`  the store pins ${entries.length} version${entries.length === 1 ? '' : 's'} of it:`);
      for (const [v, url] of entries.slice(0, 15)) {
        lines.push(`    ${v.padEnd(12)} ${url}`);
      }
      if (entries.length > 15) lines.push(`    and ${entries.length - 15} further version(s) not listed.`);
      const hasCurrent = s.url ? entries.some(([, url]) => url === s.url) : false;
      lines.push(`  ${hasCurrent ? 'The current url is one of the pinned versions.' : 'The current url is not one of the pinned versions, so the store is tracking something separate from them.'}`);
    } else {
      lines.push('  the store pins no versions of it, so the url is whatever the upstream project publishes today and can change without notice.');
    }
    lines.push('');
  }
  lines.push("  The existing search tool prints a name and a description and nothing else, so there is no way with it to see which upstream version a schema is pinned to.");
  return lines.join('\n');
}

export interface CensusArgs {
  limit?: number;
}

// ---- gap3b tools:

// The four existing tools all read catalog.json, the 1,500-entry index. Two of
// them go further and read a fileMatch pattern or a versions map out of it, but
// the schema documents themselves are never opened, so nothing about what a
// schema actually asserts is reachable. These two fetch the document the
// catalog points at and report what is really in it.

interface SchemaDoc {
  $schema?: string;
  $id?: string;
  title?: string;
  type?: string;
  properties?: Record<string, unknown>;
  definitions?: Record<string, unknown>;
  $defs?: Record<string, unknown>;
  [key: string]: unknown;
}

// The keyword census only counts the keywords an editor or validator acts on.
// Annotations like description and title are counted separately because they
// document the schema rather than constrain a document.
const CONSTRAINING = new Set([
  'type', 'required', 'enum', 'const', 'pattern', 'format', 'minimum', 'maximum',
  'exclusiveMinimum', 'exclusiveMaximum', 'minLength', 'maxLength', 'minItems',
  'maxItems', 'uniqueItems', 'multipleOf', 'items', 'properties', 'patternProperties',
  'additionalProperties', 'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else',
  'contains', 'dependencies', 'dependentSchemas', 'propertyNames', 'definitions', '$defs',
]);

function walkSchema(node: unknown, counts: Map<string, number>, refs: string[], depth = 0): void {
  if (depth > 60 || node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walkSchema(item, counts, refs, depth + 1);
    return;
  }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (CONSTRAINING.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
    if (k === '$ref' && typeof v === 'string') refs.push(v);
    walkSchema(v, counts, refs, depth + 1);
  }
}

async function fetchSchema(name: string): Promise<{ doc: SchemaDoc; url: string; bytes: number }> {
  const all = await catalog();
  const wanted = name.trim().toLowerCase();
  const entry = all.find((s) => (s.name ?? '').trim().toLowerCase() === wanted)
    ?? all.find((s) => (s.name ?? '').trim().toLowerCase().includes(wanted));
  if (!entry) return { doc: null as unknown as SchemaDoc, url: '', bytes: 0 };
  const url = entry.url;
  if (!url) throw new Error(`Schema Store lists ${entry.name} with no url, so the document cannot be fetched.`);
  const res = await fetch(url, {
    headers: { 'User-Agent': UA_SS, Accept: 'application/json' },
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Fetching ${url} returned ${res.status}`);
  const text = await res.text();
  let doc: SchemaDoc;
  try {
    doc = JSON.parse(text) as SchemaDoc;
  } catch {
    throw new Error(`${url} did not return JSON, so it cannot be reported as a schema document.`);
  }
  return { doc, url, bytes: text.length };
}

export interface DigestArgs {
  name: string;
}

export interface RefsArgs {
  name: string;
}

