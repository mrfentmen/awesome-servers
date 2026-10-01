const BASE = 'https://robohash.org';
const UA = 'mrfentmen-robohash-mcp/1.0 (https://github.com/mrfentmen)';

function sanitize(text: string): string {
  return text.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64) || 'robohash';
}

export async function avatar(args: { text?: string; size?: number; set?: number }): Promise<string> {
  const text = sanitize(args.text ?? '');
  const size = Math.max(32, Math.min(args.size ?? 300, 1024));
  const set = args.set;
  const sets: Record<number, string> = { 1: 'set1', 2: 'set2', 3: 'set3', 4: 'set4', 5: 'set5' };
  const url = `${BASE}/${encodeURIComponent(text)}.png?size=${size}x${size}${set && sets[set] ? `&set=${sets[set]}` : ''}&bgset=bg1`;
  // Lightweight HEAD probe to confirm the image is servable.
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return `Avatar URL (probe returned ${res.status}): ${url}`;
  } catch {
    // network hiccup: still return the constructed URL
  }
  return `Robot avatar for "${args.text ?? ''}": ${url}\nDownload or embed the PNG directly.`;
}

// ---- muxB tools:

import { createHash } from 'node:crypto';

const FORMATS = ['png', 'jpg', 'bmp', 'gif', 'svg'] as const;
const SETS = ['set1', 'set2', 'set3', 'set4', 'set5'] as const;
const BGSETS = ['bg1', 'bg2'] as const;

const RH_UA = 'mrfentmen-robohash-mcp/1.0 (https://github.com/mrfentmen)';

const digest = (buf: ArrayBuffer): string => createHash('sha256').update(Buffer.from(buf)).digest('hex').slice(0, 12);

interface Probe {
  label: string;
  url: string;
  status: number;
  type: string;
  bytes: number;
  digest: string;
}

async function probeRobo(url: string): Promise<Pick<Probe, 'status' | 'type' | 'bytes' | 'digest'>> {
  const res = await fetch(url, { headers: { 'User-Agent': RH_UA }, signal: AbortSignal.timeout(20000) });
  const buf = await res.arrayBuffer();
  return {
    status: res.status,
    type: res.headers.get('content-type') ?? 'not reported',
    bytes: buf.byteLength,
    digest: digest(buf),
  };
}

export interface RobohashVariantsArgs {
  text?: string
  size?: number
}

export async function robohashVariants(args: RobohashVariantsArgs): Promise<string> {
  const text = sanitize(args.text ?? '') || 'robohash';
  const size = Math.max(32, Math.min((args.size ?? 200) || 200, 1024));
  const base = `${BASE}/${encodeURIComponent(text)}`;
  const wanted: Array<{ label: string; url: string }> = [];
  for (const format of FORMATS) {
    wanted.push({ label: `format ${format}`, url: `${base}.${format}?size=${size}x${size}` });
  }
  for (const set of SETS) {
    wanted.push({ label: `set ${set}`, url: `${base}.png?size=${size}x${size}&set=${set}` });
  }
  for (const bg of BGSETS) {
    wanted.push({ label: `background ${bg}`, url: `${base}.png?size=${size}x${size}&bgset=${bg}` });
  }
  const results: Probe[] = [];
  for (const w of wanted) {
    try {
      const r = await probeRobo(w.url);
      results.push({ label: w.label, url: w.url, ...r });
    } catch (e) {
      results.push({ label: w.label, url: w.url, status: 0, type: `request failed: ${e instanceof Error ? e.message : String(e)}`, bytes: 0, digest: '-' });
    }
  }
  const reference = results.find((r) => r.status === 200);
  const lines = [
    `RoboHash variant matrix for seed "${text}" at ${size}px (${results.length} documented parameter variants, each fetched):`,
  ];
  for (const r of results) {
    const sameAsDefault = reference && r.digest === reference.digest && r.status === reference.status;
    lines.push(
      `* ${r.label} - HTTP ${r.status || 'n/a'}, ${r.type}, ${r.bytes.toLocaleString('en-US')} bytes, sha256:${r.digest}` +
        (sameAsDefault ? ' [byte-identical to the plain .png reference]' : '')
    );
  }
  const ok = results.filter((r) => r.status === 200).length;
  const distinct = new Set(results.filter((r) => r.status === 200).map((r) => r.digest)).size;
  lines.push('');
  lines.push(`${ok} of ${results.length} variants served, and they produce ${distinct} distinct image(s) from this one seed.`);
  if (distinct < ok) {
    lines.push('Variants marked byte-identical above were ignored by robohash.org and fall back to the default render.');
  }
  return lines.join('\n');
}

export interface RobohashCompareArgs {
  text?: string
  otherSeeds?: string[]
  size?: number
  set?: number
}

export async function robohashCompare(args: RobohashCompareArgs): Promise<string> {
  const text = sanitize(args.text ?? '') || 'robohash';
  const size = Math.max(32, Math.min((args.size ?? 200) || 200, 1024));
  const set = args.set;
  const sets: Record<number, string> = { 1: 'set1', 2: 'set2', 3: 'set3', 4: 'set4', 5: 'set5' };
  const setParam = set && sets[set] ? `&set=${sets[set]}` : '';
  const url = `${BASE}/${encodeURIComponent(text)}.png?size=${size}x${size}${setParam}&bgset=bg1`;
  const first = await probeRobo(url);
  const second = await probeRobo(url);
  const other = (args.otherSeeds ?? [])
    .map((s) => sanitize(String(s ?? '')))
    .filter(Boolean)
    .slice(0, 6);
  const lines = [
    `RoboHash determinism check for seed "${text}" at ${size}px${set && sets[set] ? ` on ${sets[set]}` : ''}:`,
    `* reference ${url}`,
    `* request 1 - HTTP ${first.status}, ${first.bytes.toLocaleString('en-US')} bytes, sha256:${first.digest}`,
    `* request 2 - HTTP ${second.status}, ${second.bytes.toLocaleString('en-US')} bytes, sha256:${second.digest}`,
    `  ${first.digest === second.digest && first.bytes === second.bytes ? 'Stable: the same seed returns the same image every time.' : 'Unstable: the same seed returned different bytes on two consecutive requests.'}`,
  ];
  if (!other.length) {
    lines.push('Provide otherSeeds to check which seeds collide with this one.');
    return lines.join('\n');
  }
  const lines2: string[] = ['', 'Other seeds at the same size and set:'];
  let collisions = 0;
  for (const seed of other) {
    const otherUrl = `${BASE}/${encodeURIComponent(seed)}.png?size=${size}x${size}${setParam}&bgset=bg1`;
    try {
      const r = await probeRobo(otherUrl);
      const same = r.digest === first.digest && r.bytes === first.bytes;
      if (same) collisions += 1;
      lines2.push(`* ${seed} - HTTP ${r.status}, ${r.bytes.toLocaleString('en-US')} bytes, sha256:${r.digest}${same ? ' [collides with the reference seed]' : ' [distinct from the reference seed]'}`);
    } catch (e) {
      lines2.push(`* ${seed} - request failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  lines.push(...lines2);
  lines.push('');
  lines.push(collisions ? `${collisions} of ${other.length} comparison seed(s) render identically to "${text}".` : `None of the ${other.length} comparison seeds render identically to "${text}".`);
  return lines.join('\n');
}
