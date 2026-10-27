/**
 * Thin HTTP layer for the NeverBounce REST API (v4.2, JSON over POST).
 * Reads the key from the environment (never from arguments) and unwraps the
 * vendor's { status: "error", message } shape into plain errors.
 */
import { assertSuccess, classifyCheck, jobsCreatePayload, jobsResultsPayload, jobsStatusPayload, poeConfirmPayload, resultsTally, shapeAccountInfo, shapeSingleCheck, singleCheckPayload, validateJobId, } from './util.js';
const BASE = 'https://api.neverbounce.com/v4.2';
export function requireApiKey() {
    const key = process.env.NEVERBOUNCE_API_KEY;
    if (!key || key.trim() === '') {
        throw new Error('NEVERBOUNCE_API_KEY is not set. Create a Custom Integration App in the NeverBounce dashboard to get a key (format: secret_xxxx).');
    }
    return key.trim();
}
export async function nbPost(endpoint, payload) {
    const resp = await fetch(`${BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`neverbounce ${endpoint} failed: HTTP ${resp.status} ${text.slice(0, 300)}`);
    }
    return (await resp.json());
}
export function accountInfo() {
    return nbPost('account/info', { key: requireApiKey() }).then((d) => {
        shapeAccountInfo('account/info', d);
        return d;
    });
}
export function verifyEmail(email, timeout) {
    const payload = singleCheckPayload(requireApiKey(), email, timeout);
    return nbPost('single/check', payload).then((d) => shapeSingleCheck('single/check', d));
}
export function jobStatus(jobId) {
    return nbPost('jobs/status', jobsStatusPayload(requireApiKey(), jobId)).then((d) => {
        assertSuccess('jobs/status', d);
        return d;
    });
}
export function jobResults(jobId, startPage, itemsPerPage) {
    return nbPost('jobs/results', jobsResultsPayload(requireApiKey(), jobId, startPage, itemsPerPage)).then((d) => {
        assertSuccess('jobs/results', d);
        return d;
    });
}
export function jobDelete(jobId) {
    return nbPost('jobs/delete', jobsStatusPayload(requireApiKey(), jobId)).then((d) => {
        assertSuccess('jobs/delete', d);
        return d;
    });
}
export function accountUsage() {
    return nbPost('account/info', { key: requireApiKey() }).then((d) => shapeAccountInfo('account/info', d));
}
export async function verifyEmailVerdict(email, timeout) {
    const shaped = (await verifyEmail(email, timeout));
    return { ...shaped, verdict: classifyCheck(shaped.result, shaped.flags) };
}
export function jobCreate(opts) {
    return nbPost('jobs/create', jobsCreatePayload(requireApiKey(), opts)).then((d) => {
        assertSuccess('jobs/create', d);
        return d;
    });
}
export function jobStart(jobId) {
    return nbPost('jobs/start', { key: requireApiKey(), job_id: validateJobId(jobId) }).then((d) => {
        assertSuccess('jobs/start', d);
        return d;
    });
}
export function poeConfirm(transactionId, token) {
    return nbPost('poe/confirm', poeConfirmPayload(requireApiKey(), transactionId, token)).then((d) => {
        assertSuccess('poe/confirm', d);
        return d;
    });
}
export function jobDownload(jobId, fileFormat) {
    const fmt = String(fileFormat ?? 'json');
    if (fmt !== 'json' && fmt !== 'csv')
        throw new Error('file_format must be "json" or "csv"');
    return nbPost('jobs/download', { key: requireApiKey(), job_id: validateJobId(jobId), file_format: fmt }).then((d) => {
        assertSuccess('jobs/download', d);
        return d;
    });
}
export async function jobResultsSummary(jobId, startPage, itemsPerPage) {
    const d = (await jobResults(jobId, startPage, itemsPerPage));
    return { ...resultsTally(d), query_info: d.query_info ?? null };
}
