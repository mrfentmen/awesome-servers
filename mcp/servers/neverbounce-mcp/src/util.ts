/**
 * Pure helpers for neverbounce-mcp: input validation, request-payload
 * building and response shaping. No network calls and no process.env reads
 * here - unit-tested directly from tests/util.test.js against the built dist/.
 */

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Trim and sanity-check one email address; throws with a caller-friendly message. */
export function validateEmail(email: string): string {
  const trimmed = email.trim();
  if (!EMAIL.test(trimmed)) throw new Error(`not a plausible email address: ${email}`);
  return trimmed;
}

/** Single-check timeout in seconds (NeverBounce caps this window at 30). */
export function validateTimeout(timeout: unknown): number {
  if (timeout == null) return 30;
  const t = Number(timeout);
  if (!Number.isInteger(t) || t < 3 || t > 30) {
    throw new Error('timeout must be an integer between 3 and 30 seconds');
  }
  return t;
}

/** Validate pagination arguments for jobs/results; returns only what was given. */
export function validatePageArgs(
  startPage: unknown,
  itemsPerPage: unknown,
): { start_page?: number; items_per_page?: number } {
  const out: { start_page?: number; items_per_page?: number } = {};
  if (startPage != null) {
    const n = Number(startPage);
    if (!Number.isInteger(n) || n < 1) throw new Error('start_page must be a positive integer');
    out.start_page = n;
  }
  if (itemsPerPage != null) {
    const n = Number(itemsPerPage);
    if (!Number.isInteger(n) || n < 1 || n > 500) {
      throw new Error('items_per_page must be an integer between 1 and 500');
    }
    out.items_per_page = n;
  }
  return out;
}

/** Validate a job id coming from tool arguments. */
export function validateJobId(jobId: unknown): string {
  const id = String(jobId ?? '').trim();
  if (id === '') throw new Error('job_id is required');
  return id;
}

export function singleCheckPayload(
  key: string,
  email: string,
  timeout?: unknown,
): Record<string, unknown> {
  return { key, email: validateEmail(email), timeout: validateTimeout(timeout) };
}

export function jobsStatusPayload(key: string, jobId: unknown): Record<string, unknown> {
  return { key, job_id: validateJobId(jobId) };
}

export function jobsResultsPayload(
  key: string,
  jobId: unknown,
  startPage: unknown,
  itemsPerPage: unknown,
): Record<string, unknown> {
  return { key, job_id: validateJobId(jobId), ...validatePageArgs(startPage, itemsPerPage) };
}

/** Throw the NeverBounce error shape in one place; returns void on success. */
export function assertSuccess(endpoint: string, data: Record<string, unknown>): void {
  if (data.status !== 'success') {
    throw new Error(
      `neverbounce ${endpoint} error: status=${String(data.status)} ${String(data.message ?? 'no message')}`,
    );
  }
}

/** Compact view of one /single/check answer. */
export function shapeSingleCheck(endpoint: string, data: Record<string, unknown>): Record<string, unknown> {
  assertSuccess(endpoint, data);
  const d = data as {
    result?: string;
    flags?: Record<string, unknown>;
    suggested_correction?: string;
    execution_time?: number;
  };
  return {
    result: d.result,
    flags: d.flags ?? {},
    suggested_correction: d.suggested_correction ?? null,
    execution_time: d.execution_time ?? null,
  };
}

/** Compact view of /account/info: what matters is credits left. */
export function shapeAccountInfo(endpoint: string, data: Record<string, unknown>): Record<string, unknown> {
  assertSuccess(endpoint, data);
  return {
    credits: data.credits ?? null,
    monthly_usage: data.monthly_usage ?? null,
    monthly_limit: data.monthly_limit ?? null,
  };
}
