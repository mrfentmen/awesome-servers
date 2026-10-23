/**
 * Thin HTTP layer for the NeverBounce REST API (v4.2, JSON over POST).
 * Reads the key from the environment (never from arguments) and unwraps the
 * vendor's { status: "error", message } shape into plain errors.
 */
import {
  assertSuccess,
  classifyCheck,
  jobsCreatePayload,
  jobsResultsPayload,
  jobsStatusPayload,
  poeConfirmPayload,
  resultsTally,
  shapeAccountInfo,
  shapeSingleCheck,
  singleCheckPayload,
  validateJobId,
  type JobCreateOpts,
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

export function accountUsage(): Promise<Record<string, unknown>> {
  return nbPost('account/info', { key: requireApiKey() }).then((d) => shapeAccountInfo('account/info', d));
}

export async function verifyEmailVerdict(email: string, timeout?: unknown): Promise<Record<string, unknown>> {
  const shaped = (await verifyEmail(email, timeout)) as {
    result?: string;
    flags?: Record<string, unknown>;
  };
  return { ...shaped, verdict: classifyCheck(shaped.result, shaped.flags) };
}

export function jobCreate(opts: JobCreateOpts): Promise<unknown> {
  return nbPost('jobs/create', jobsCreatePayload(requireApiKey(), opts)).then((d) => {
    assertSuccess('jobs/create', d);
    return d;
  });
}

export function jobStart(jobId: unknown): Promise<unknown> {
  return nbPost('jobs/start', { key: requireApiKey(), job_id: validateJobId(jobId) }).then((d) => {
    assertSuccess('jobs/start', d);
    return d;
  });
}

export function poeConfirm(transactionId: unknown, token: unknown): Promise<unknown> {
  return nbPost('poe/confirm', poeConfirmPayload(requireApiKey(), transactionId, token)).then((d) => {
    assertSuccess('poe/confirm', d);
    return d;
  });
}

export function jobDownload(jobId: unknown, fileFormat: unknown): Promise<unknown> {
  const fmt = String(fileFormat ?? 'json');
  if (fmt !== 'json' && fmt !== 'csv') throw new Error('file_format must be "json" or "csv"');
  return nbPost('jobs/download', { key: requireApiKey(), job_id: validateJobId(jobId), file_format: fmt }).then((d) => {
    assertSuccess('jobs/download', d);
    return d;
  });
}

export async function jobResultsSummary(
  jobId: unknown,
  startPage: unknown,
  itemsPerPage: unknown,
): Promise<Record<string, unknown>> {
  const d = (await jobResults(jobId, startPage, itemsPerPage)) as Record<string, unknown>;
  return { ...resultsTally(d), query_info: (d as { query_info?: unknown }).query_info ?? null };
}
