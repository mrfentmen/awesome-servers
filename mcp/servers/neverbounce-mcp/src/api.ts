/**
 * Thin HTTP layer for the NeverBounce REST API (v4.2, JSON over POST).
 * Reads the key from the environment (never from arguments) and unwraps the
 * vendor's { status: "error", message } shape into plain errors.
 */
import {
  assertSuccess,
  jobsResultsPayload,
  jobsStatusPayload,
  shapeAccountInfo,
  shapeSingleCheck,
  singleCheckPayload,
} from './util.js';

const BASE = 'https://api.neverbounce.com/v4.2';

export function requireApiKey(): string {
  const key = process.env.NEVERBOUNCE_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error(
      'NEVERBOUNCE_API_KEY is not set. Create a Custom Integration App in the NeverBounce dashboard to get a key (format: secret_xxxx).',
    );
  }
  return key.trim();
}

export async function nbPost(endpoint: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const resp = await fetch(`${BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`neverbounce ${endpoint} failed: HTTP ${resp.status} ${text.slice(0, 300)}`);
  }
  return (await resp.json()) as Record<string, unknown>;
}

export function accountInfo(): Promise<Record<string, unknown>> {
  return nbPost('account/info', { key: requireApiKey() }).then((d) => {
    shapeAccountInfo('account/info', d);
    return d;
  });
}

export function verifyEmail(email: string, timeout?: unknown): Promise<unknown> {
  const payload = singleCheckPayload(requireApiKey(), email, timeout);
  return nbPost('single/check', payload).then((d) => shapeSingleCheck('single/check', d));
}

export function jobStatus(jobId: unknown): Promise<unknown> {
  return nbPost('jobs/status', jobsStatusPayload(requireApiKey(), jobId)).then((d) => {
    assertSuccess('jobs/status', d);
    return d;
  });
}

export function jobResults(jobId: unknown, startPage: unknown, itemsPerPage: unknown): Promise<unknown> {
  return nbPost('jobs/results', jobsResultsPayload(requireApiKey(), jobId, startPage, itemsPerPage)).then((d) => {
    assertSuccess('jobs/results', d);
    return d;
  });
}

export function jobDelete(jobId: unknown): Promise<unknown> {
  return nbPost('jobs/delete', jobsStatusPayload(requireApiKey(), jobId)).then((d) => {
    assertSuccess('jobs/delete', d);
    return d;
  });
}
