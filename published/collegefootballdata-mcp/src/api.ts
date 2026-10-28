/**
 * Thin HTTP layer for the CollegeFootballData API (api.collegefootballdata.com).
 * The key is read from the environment, never from tool arguments.
 */
import { buildUrl, type QueryParams } from './util.js';

const BASE = 'https://api.collegefootballdata.com';

export function requireApiKey(): string {
  const key = process.env.COLLEGEFOOTBALLDATA_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error(
      'COLLEGEFOOTBALLDATA_API_KEY is not set. Get a free key at https://api.collegefootballdata.com (log in with a Google account) and export it before starting this server.',
    );
  }
  return key.trim();
}

export async function cfbdGet(path: string, params: QueryParams = {}): Promise<unknown> {
  const url = buildUrl(BASE, path, params, requireApiKey());
  const resp = await fetch(url, { headers: { accept: 'application/json' } });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`CFBD ${path} failed: HTTP ${resp.status} ${text.slice(0, 300)}`);
  }
  return resp.json();
}
