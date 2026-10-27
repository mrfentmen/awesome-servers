/**
 * Pure helpers for neverbounce-mcp: input validation, request-payload
 * building and response shaping. No network calls and no process.env reads
 * here - unit-tested directly from tests/util.test.js against the built dist/.
 */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** Trim and sanity-check one email address; throws with a caller-friendly message. */
export function validateEmail(email) {
    const trimmed = email.trim();
    if (!EMAIL.test(trimmed))
        throw new Error(`not a plausible email address: ${email}`);
    return trimmed;
}
/** Single-check timeout in seconds (NeverBounce caps this window at 30). */
export function validateTimeout(timeout) {
    if (timeout == null)
        return 30;
    const t = Number(timeout);
    if (!Number.isInteger(t) || t < 3 || t > 30) {
        throw new Error('timeout must be an integer between 3 and 30 seconds');
    }
    return t;
}
/** Validate pagination arguments for jobs/results; returns only what was given. */
export function validatePageArgs(startPage, itemsPerPage) {
    const out = {};
    if (startPage != null) {
        const n = Number(startPage);
        if (!Number.isInteger(n) || n < 1)
            throw new Error('start_page must be a positive integer');
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
export function validateJobId(jobId) {
    const id = String(jobId ?? '').trim();
    if (id === '')
        throw new Error('job_id is required');
    return id;
}
export function singleCheckPayload(key, email, timeout) {
    return { key, email: validateEmail(email), timeout: validateTimeout(timeout) };
}
export function jobsStatusPayload(key, jobId) {
    return { key, job_id: validateJobId(jobId) };
}
export function jobsResultsPayload(key, jobId, startPage, itemsPerPage) {
    return { key, job_id: validateJobId(jobId), ...validatePageArgs(startPage, itemsPerPage) };
}
/** Throw the NeverBounce error shape in one place; returns void on success. */
export function assertSuccess(endpoint, data) {
    if (data.status !== 'success') {
        throw new Error(`neverbounce ${endpoint} error: status=${String(data.status)} ${String(data.message ?? 'no message')}`);
    }
}
/** Compact view of one /single/check answer. */
export function shapeSingleCheck(endpoint, data) {
    assertSuccess(endpoint, data);
    const d = data;
    return {
        result: d.result,
        flags: d.flags ?? {},
        suggested_correction: d.suggested_correction ?? null,
        execution_time: d.execution_time ?? null,
    };
}
/** Compact view of /account/info: what matters is credits left. */
export function shapeAccountInfo(endpoint, data) {
    assertSuccess(endpoint, data);
    return {
        credits: data.credits ?? null,
        monthly_usage: data.monthly_usage ?? null,
        monthly_limit: data.monthly_limit ?? null,
    };
}
/** Build the /jobs/create body; the vendor takes exactly one list source. */
export function jobsCreatePayload(key, opts) {
    const sources = [opts.email_filename, opts.email_list_folder].filter((v) => typeof v === 'string' && v.trim() !== '');
    if (sources.length !== 1) {
        throw new Error('pass exactly one of email_filename or email_list_folder (uploaded in the NeverBounce dashboard)');
    }
    const payload = { key };
    if (opts.email_filename)
        payload.email_filename = opts.email_filename.trim();
    if (opts.email_list_folder)
        payload.email_list_folder = opts.email_list_folder.trim();
    payload.auto_parse = opts.auto_parse ?? true;
    if (opts.run_sample != null)
        payload.run_sample = opts.run_sample;
    if (opts.job_name && opts.job_name.trim() !== '')
        payload.job_name = opts.job_name.trim();
    return payload;
}
/** Build the /poe/confirm body (Proof of Email token verification). */
export function poeConfirmPayload(key, transactionId, token) {
    const tid = String(transactionId ?? '').trim();
    const tok = String(token ?? '').trim();
    if (tid === '' || tok === '')
        throw new Error('transaction_id and token are both required');
    return { key, transaction_id: tid, token: tok };
}
/**
 * Client-side decision layer over one verification answer: should an agent
 * send to this address? Honest about which verdicts are judgments.
 */
export function classifyCheck(result, flags) {
    const f = flags ?? {};
    if (f.spamtrap === true)
        return { verdict: 'dead', reason: 'flagged as a spamtrap' };
    switch (result) {
        case 'valid':
            return { verdict: 'safe', reason: 'mailbox verified deliverable' };
        case 'catchall':
            return { verdict: 'risky', reason: 'catchall domain - mailbox acceptance cannot be verified' };
        case 'disposable':
            return { verdict: 'risky', reason: 'disposable email provider' };
        case 'invalid':
            return { verdict: 'dead', reason: 'mailbox does not exist' };
        case 'unknown':
            return { verdict: 'unknown', reason: 'provider could not verify; retry later' };
        default:
            return { verdict: 'unknown', reason: `unexpected result ${String(result)}` };
    }
}
/**
 * Tally one page of /jobs/results rows by verification result. Honest about
 * being a per-page count, not a job total.
 */
export function resultsTally(data) {
    const raw = data.results;
    const results = Array.isArray(raw) ? raw : [];
    const tally = {};
    for (const row of results) {
        const v = (row.verification ?? {});
        const k = String(v.result ?? 'unknown');
        tally[k] = (tally[k] ?? 0) + 1;
    }
    return { tally, counted: results.length };
}
