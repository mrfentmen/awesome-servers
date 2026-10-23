/**
 * Thin HTTP layer for the DocRaptor REST API. Auth is HTTP Basic where the
 * username is the API key (the password stays empty), per DocRaptor's docs.
 * The key is read from the environment, never from tool arguments.
 */
import { buildDocsPayload, type DocsPayloadOptions } from './util.js';

const DOCS_URL = 'https://api.docraptor.com/docs';

export function requireApiKey(): string {
  const key = process.env.DOCRAPTOR_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error(
      'DOCRAPTOR_API_KEY is not set. Get a free trial key at https://docraptor.com and export it before starting this server.',
    );
  }
  return key.trim();
}

export interface CreatedDocument {
  bytes: Buffer;
  contentType: string;
  /** The payload echo, minus nothing sensitive (the key is only in the header). */
  request: Record<string, unknown>;
}

export async function createDocument(opts: DocsPayloadOptions): Promise<CreatedDocument> {
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
  if (bytes.length === 0) throw new Error('docraptor returned an empty document');
  return { bytes, contentType: resp.headers.get('content-type') ?? 'application/octet-stream', request: body };
}
