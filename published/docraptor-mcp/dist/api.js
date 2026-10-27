/**
 * Thin HTTP layer for the DocRaptor REST API. Auth is HTTP Basic where the
 * username is the API key (the password stays empty), per DocRaptor's docs.
 * The key is read from the environment, never from tool arguments.
 */
import { buildDocsPayload } from './util.js';
const DOCS_URL = 'https://api.docraptor.com/docs';
export function requireApiKey() {
    const key = process.env.DOCRAPTOR_API_KEY;
    if (!key || key.trim() === '') {
        throw new Error('DOCRAPTOR_API_KEY is not set. Get a free trial key at https://docraptor.com and export it before starting this server.');
    }
    return key.trim();
}
export async function createDocument(opts) {
    const body = buildDocsPayload(opts);
    const auth = Buffer.from(`${requireApiKey()}:`).toString('base64');
    const resp = await fetch(DOCS_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Basic ${auth}` },
        body: JSON.stringify(body),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`docraptor failed: HTTP ${resp.status} ${text.slice(0, 500)}`);
    }
    const bytes = Buffer.from(await resp.arrayBuffer());
    if (bytes.length === 0)
        throw new Error('docraptor returned an empty document');
    return { bytes, contentType: resp.headers.get('content-type') ?? 'application/octet-stream', request: body };
}
/** POST /async/docs: same request body, but answers with URLs instead of bytes. */
export async function createAsyncDocument(opts) {
    const body = buildDocsPayload(opts);
    const auth = Buffer.from(`${requireApiKey()}:`).toString('base64');
    const resp = await fetch('https://api.docraptor.com/async/docs', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Basic ${auth}` },
        body: JSON.stringify(body),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`docraptor async create failed: HTTP ${resp.status} ${text.slice(0, 500)}`);
    }
    return (await resp.json());
}
/** Refuse URLs that do not point back at DocRaptor (the URLs are presigned). */
function assertDocraptorUrl(url, label) {
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        throw new Error(`${label} is not a valid URL`);
    }
    if (parsed.hostname !== 'api.docraptor.com' && parsed.hostname !== 'docraptor.com') {
        throw new Error(`${label} must point at api.docraptor.com (got ${parsed.hostname})`);
    }
    return url;
}
export async function fetchStatusJson(statusUrl) {
    assertDocraptorUrl(statusUrl, 'status_url');
    const resp = await fetch(statusUrl, { headers: { accept: 'application/json' } });
    if (!resp.ok) {
        throw new Error(`async status failed: HTTP ${resp.status} ${(await resp.text()).slice(0, 300)}`);
    }
    return resp.json();
}
export async function fetchDocumentBytes(downloadUrl) {
    assertDocraptorUrl(downloadUrl, 'download_url');
    const resp = await fetch(downloadUrl);
    if (!resp.ok) {
        throw new Error(`async fetch failed: HTTP ${resp.status} ${(await resp.text()).slice(0, 300)}`);
    }
    const bytes = Buffer.from(await resp.arrayBuffer());
    if (bytes.length === 0)
        throw new Error('docraptor returned an empty document');
    return {
        bytes,
        contentType: resp.headers.get('content-type') ?? 'application/octet-stream',
        request: { download_url: downloadUrl },
    };
}
/** Check a document_url is reachable before spending a render on it. */
export async function checkSourceUrl(url) {
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        throw new Error('document_url is not a valid URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('document_url must be http(s)://');
    }
    try {
        const resp = await fetch(parsed.toString(), {
            method: 'GET',
            headers: { 'user-agent': 'docraptor-mcp url check' },
        });
        return {
            ok: resp.ok,
            status: resp.status,
            content_type: resp.headers.get('content-type') ?? undefined,
            detail: resp.ok
                ? 'reachable'
                : `HTTP ${resp.status} - the renderer will likely fail or produce an error page`,
        };
    }
    catch (err) {
        return {
            ok: false,
            detail: `unreachable: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
