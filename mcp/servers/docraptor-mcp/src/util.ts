/**
 * Pure helpers for docraptor-mcp: payload building and naming. No network
 * calls and no process.env reads here - unit-tested directly from
 * tests/util.test.js against the built dist/.
 */

export type DocType = 'pdf' | 'xlsx';

export interface DocsPayloadOptions {
  name: string;
  type: DocType;
  documentContent?: string;
  documentUrl?: string;
  test?: boolean;
  baseUrl?: string;
  httpTimeout?: number;
  insecure?: boolean;
  javascript?: boolean;
}

export function slugifyName(name: string): string {
  const slug = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'document' : slug.slice(0, 80);
}

export function outputFileName(name: string, type: DocType): string {
  return `${slugifyName(name)}.${type}`;
}

/**
 * Build the POST /docs JSON body and validate the combinations DocRaptor
 * rejects server-side anyway (exactly one source, sane timeouts).
 */
export function buildDocsPayload(opts: DocsPayloadOptions): Record<string, unknown> {
  const name = (opts.name ?? '').trim();
  if (name === '') throw new Error('name is required (used to identify the document)');
  if (opts.type !== 'pdf' && opts.type !== 'xlsx') {
    throw new Error(`type must be "pdf" or "xlsx" (got ${String(opts.type)})`);
  }
  const hasContent = typeof opts.documentContent === 'string' && opts.documentContent.length > 0;
  const hasUrl = typeof opts.documentUrl === 'string' && opts.documentUrl.trim() !== '';
  if (hasContent === hasUrl) {
    throw new Error('pass exactly one of document_content or document_url');
  }
  const payload: Record<string, unknown> = { type: opts.type, name, test: opts.test ?? true };
  if (hasContent) payload.document_content = opts.documentContent;
  else payload.document_url = opts.documentUrl!.trim();

  const prince: Record<string, unknown> = {};
  if (opts.baseUrl && opts.baseUrl.trim() !== '') prince.baseurl = opts.baseUrl.trim();
  if (opts.httpTimeout != null) {
    if (!Number.isInteger(opts.httpTimeout) || opts.httpTimeout < 1 || opts.httpTimeout > 60) {
      throw new Error('http_timeout must be an integer between 1 and 60 seconds');
    }
    prince.http_timeout = opts.httpTimeout;
  }
  if (typeof opts.insecure === 'boolean') prince.insecure = opts.insecure;
  if (typeof opts.javascript === 'boolean') prince.javascript = opts.javascript;
  if (Object.keys(prince).length > 0) payload.prince_options = prince;
  return payload;
}

/** Above this size, refuse to inline base64 into a tool result and ask for save_path. */
export const BASE64_RETURN_LIMIT = 1_000_000;
