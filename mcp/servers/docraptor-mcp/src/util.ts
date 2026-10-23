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

/** Escape one value for interpolation into generated HTML. */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Minimal HTML table - the source for XLSX renders built from raw rows. */
export function htmlTable(
  title: string | undefined,
  headers: string[] | undefined,
  rows: unknown[][],
): string {
  let html = '<html><body style="font-family: Helvetica, Arial, sans-serif">';
  if (title && title.trim() !== '') html += `<h1>${esc(title)}</h1>`;
  html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse">';
  if (headers && headers.length > 0) {
    html += '<tr>' + headers.map((h) => `<th>${esc(h)}</th>`).join('') + '</tr>';
  }
  for (const row of rows) html += '<tr>' + row.map((cell) => `<td>${esc(cell)}</td>`).join('') + '</tr>';
  html += '</table></body></html>';
  return html;
}

/** Title + meta line + table, with a small embedded stylesheet. */
export function buildStyledReportHtml(
  title: string,
  meta: string | undefined,
  headers: string[] | undefined,
  rows: unknown[][],
): string {
  let html =
    '<html><head><style>' +
    'body { font-family: Helvetica, Arial, sans-serif; margin: 40px; color: #222 } ' +
    'h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 6px } ' +
    'p.meta { color: #666 } ' +
    'table { border-collapse: collapse; width: 100%; margin-top: 18px } ' +
    'th { background: #333; color: #fff; text-align: left } ' +
    'th, td { border: 1px solid #999; padding: 6px 10px } ' +
    '</style></head><body>';
  html += `<h1>${esc(title)}</h1>`;
  if (meta && meta.trim() !== '') html += `<p class="meta">${esc(meta)}</p>`;
  html += '<table>';
  if (headers && headers.length > 0) {
    html += '<tr>' + headers.map((h) => `<th>${esc(h)}</th>`).join('') + '</tr>';
  }
  for (const row of rows) html += '<tr>' + row.map((cell) => `<td>${esc(cell)}</td>`).join('') + '</tr>';
  html += '</table></body></html>';
  return html;
}

/**
 * Local (no API call) sanity checks on HTML before spending a render:
 * basic structure, tag balance for common block tags, insecure asset URLs.
 */
export function validateHtml(html: string): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!html || html.trim() === '') issues.push('document_content is empty');
  for (const tag of ['html', 'head', 'body']) {
    if (!new RegExp(`<${tag}[\\s>]`, 'i').test(html)) issues.push(`missing <${tag}> element`);
  }
  const openTags = html.match(/<(div|table|tr|td|th|p|span)\b[^>]*>/gi) ?? [];
  const closeTags = html.match(/<\/(div|table|tr|td|th|p|span)>/gi) ?? [];
  if (openTags.length !== closeTags.length) {
    issues.push(
      `tag balance: ${openTags.length} open vs ${closeTags.length} close for div/table/tr/td/th/p/span`,
    );
  }
  const httpAssets = html.match(/(src|href)="http:\/\//gi) ?? [];
  if (httpAssets.length > 0) {
    issues.push(`${httpAssets.length} insecure http:// asset URL(s) - may be blocked by the renderer`);
  }
  return { ok: issues.length === 0, issues };
}
