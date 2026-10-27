#!/usr/bin/env node
/**
 * docraptor-mcp - HTML-to-PDF/XLSX documents through the DocRaptor API.
 *
 * Tools:
 *  - docraptor_create_pdf         : render HTML content or a URL to PDF (test mode by default)
 *  - docraptor_create_xlsx        : render HTML/CSV-ish content to XLSX
 *  - docraptor_create_xlsx_from_rows: headers + rows -> table HTML -> XLSX
 *  - docraptor_create_report      : title + meta + table -> styled PDF
 *  - docraptor_create_async       : POST /async/docs; answers with URLs, not bytes
 *  - docraptor_async_status       : read the status_url of an async create
 *  - docraptor_async_fetch        : read the download_url of a finished async doc
 *  - docraptor_create_production  : test=false render, requires explicit confirm
 *  - docraptor_test_ping          : free test-mode health check
 *  - docraptor_validate_html      : local HTML sanity checks before spending a render
 *  - docraptor_check_source_url   : verify a document_url is reachable first
 *
 * Output handling: pass save_path to write the file to disk; without it the
 * tool inlines base64 for documents under 1 MB and refuses bigger ones.
 *
 * First-party MCP coverage check (2026-10-23): no official DocRaptor MCP and
 * no MCP package on npm under this name. See mcp/MISSING.md for the log.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  checkSourceUrl,
  createAsyncDocument,
  createDocument,
  fetchDocumentBytes,
  fetchStatusJson,
  type CreatedDocument,
} from './api.js';
import {
  BASE64_RETURN_LIMIT,
  buildStyledReportHtml,
  htmlTable,
  outputFileName,
  validateHtml,
  type DocType,
  type DocsPayloadOptions,
} from './util.js';

const server = new Server(
  { name: 'docraptor-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

function fail(err: unknown) {
  return {
    isError: true,
    content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
  };
}

function baseOpts(args: Record<string, unknown> | undefined): DocsPayloadOptions {
  return {
    name: String(args?.name ?? ''),
    type: args?.type as DocType,
    documentContent: typeof args?.document_content === 'string' ? args.document_content : undefined,
    documentUrl: typeof args?.document_url === 'string' ? args.document_url : undefined,
    test: typeof args?.test === 'boolean' ? args.test : undefined,
    baseUrl: typeof args?.base_url === 'string' ? args.base_url : undefined,
    httpTimeout: args?.http_timeout as number | undefined,
    insecure: typeof args?.insecure === 'boolean' ? args.insecure : undefined,
    javascript: typeof args?.javascript === 'boolean' ? args.javascript : undefined,
  };
}

function rowsFrom(args: Record<string, unknown> | undefined): unknown[][] {
  const rows = args?.rows;
  if (!Array.isArray(rows)) throw new Error('rows must be an array of arrays');
  return rows.map((row, i) => {
    if (!Array.isArray(row)) throw new Error(`rows[${i}] must be an array`);
    return row;
  });
}

async function deliver(
  doc: CreatedDocument,
  fileName: string,
  savePath: unknown,
): Promise<Record<string, unknown>> {
  if (typeof savePath === 'string' && savePath.trim() !== '') {
    const path = savePath.trim();
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, doc.bytes);
    return { ok: true, saved_to: path, bytes: doc.bytes.length, content_type: doc.contentType, request: doc.request };
  }
  if (doc.bytes.length > BASE64_RETURN_LIMIT) {
    throw new Error(
      `document is ${doc.bytes.length} bytes; pass save_path to write it to disk instead of inlining base64`,
    );
  }
  return {
    ok: true,
    suggested_file_name: fileName,
    bytes: doc.bytes.length,
    content_type: doc.contentType,
    base64: doc.bytes.toString('base64'),
    request: doc.request,
  };
}

const RENDER_ARGS = {
  name: { type: 'string', description: 'document name; also becomes the default file name' },
  document_content: { type: 'string', description: 'the HTML/CSV source of the document' },
  document_url: { type: 'string', description: 'a public URL to render instead of inline content' },
  test: { type: 'boolean', default: true, description: 'test documents are free and watermarked' },
  base_url: { type: 'string', description: 'base URL for relative links in the HTML' },
  http_timeout: { type: 'integer', minimum: 1, maximum: 60, description: 'seconds' },
  insecure: { type: 'boolean', description: 'allow self-signed SSL certificates when fetching assets' },
  javascript: { type: 'boolean', description: 'run JavaScript while rendering (PDF only)' },
  save_path: { type: 'string', description: 'path to write the document to' },
};

const TOOLS = [
  {
    name: 'docraptor_create_pdf',
    description:
      'Generate ONE PDF from HTML (document_content) or a public URL (document_url). Defaults to test=true ' +
      '(free, watermarked); set test=false only when you mean to spend credits.',
    inputSchema: { type: 'object', properties: { ...RENDER_ARGS, type: { enum: ['pdf'] } }, required: ['name'], additionalProperties: false },
  },
  {
    name: 'docraptor_create_xlsx',
    description: 'Generate ONE XLSX spreadsheet from HTML/CSV-ish content or a URL. Test mode by default.',
    inputSchema: { type: 'object', properties: { ...RENDER_ARGS, type: { enum: ['xlsx'] } }, required: ['name'], additionalProperties: false },
  },
  {
    name: 'docraptor_create_xlsx_from_rows',
    description:
      'Build a table from headers + rows locally, then render it as an XLSX. No HTML authoring needed.',
    inputSchema: {
      type: 'object',
      properties: {
        name: RENDER_ARGS.name,
        headers: { type: 'array', items: { type: 'string' }, description: 'optional header row' },
        rows: { type: 'array', items: { type: 'array' }, description: 'data rows' },
        test: RENDER_ARGS.test,
        save_path: RENDER_ARGS.save_path,
      },
      required: ['name', 'rows'],
      additionalProperties: false,
    },
  },
  {
    name: 'docraptor_create_report',
    description:
      'Render a styled PDF report from a title, an optional meta line, and a table (headers + rows). ' +
      'The HTML is composed locally, the PDF by DocRaptor. Test mode by default.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        meta: { type: 'string', description: 'one-line subtitle/context' },
        headers: { type: 'array', items: { type: 'string' } },
        rows: { type: 'array', items: { type: 'array' } },
        test: RENDER_ARGS.test,
        save_path: RENDER_ARGS.save_path,
      },
      required: ['title', 'rows'],
      additionalProperties: false,
    },
  },
  {
    name: 'docraptor_create_async',
    description:
      'Queue a document on the async API instead of waiting for bytes: returns a download_url and status_url. ' +
      'Same arguments as create_pdf/create_xlsx; pick type explicitly.',
    inputSchema: { type: 'object', properties: { ...RENDER_ARGS, type: { enum: ['pdf', 'xlsx'] } }, required: ['name', 'type'], additionalProperties: false },
  },
  {
    name: 'docraptor_async_status',
    description: 'Read the status_url returned by an async create (JSON with the job state).',
    inputSchema: {
      type: 'object',
      properties: { status_url: { type: 'string', description: 'status_url from the async create response' } },
      required: ['status_url'],
      additionalProperties: false,
    },
  },
  {
    name: 'docraptor_async_fetch',
    description: 'Fetch the document bytes from a finished async job (its presigned download_url); save or inline.',
    inputSchema: {
      type: 'object',
      properties: {
        download_url: { type: 'string', description: 'download_url from the async create/status response' },
        save_path: RENDER_ARGS.save_path,
      },
      required: ['download_url'],
      additionalProperties: false,
    },
  },
  {
    name: 'docraptor_create_production',
    description:
      'A real (test=false) render that spends credits. Refuses to run unless confirm=true is passed, so a ' +
      'caller cannot bill you by accident.',
    inputSchema: {
      type: 'object',
      properties: { ...RENDER_ARGS, type: { enum: ['pdf', 'xlsx'] }, confirm: { type: 'boolean', description: 'must be true' } },
      required: ['name', 'type', 'confirm'],
      additionalProperties: false,
    },
  },
  {
    name: 'docraptor_test_ping',
    description: 'Render a tiny free test PDF - a health check that the API key and account work.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'docraptor_validate_html',
    description:
      'Local sanity checks on HTML before spending a render: required elements, tag balance for common ' +
      'block tags, insecure http:// asset URLs. No API call.',
    inputSchema: {
      type: 'object',
      properties: { html: { type: 'string' } },
      required: ['html'],
      additionalProperties: false,
    },
  },
  {
    name: 'docraptor_check_source_url',
    description:
      'GET a document_url once to check the renderer will be able to reach it (status + content type). ' +
      'Cheaper than a failed render.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'the URL you plan to pass as document_url' } },
      required: ['url'],
      additionalProperties: false,
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params as { name: string; arguments?: Record<string, unknown> };
  const json = (data: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
  try {
    switch (name) {
      case 'docraptor_create_pdf':
        return json(await deliver(await createDocument({ ...baseOpts(args), type: 'pdf' }), outputFileName(String(args?.name ?? ''), 'pdf'), args?.save_path));
      case 'docraptor_create_xlsx':
        return json(await deliver(await createDocument({ ...baseOpts(args), type: 'xlsx' }), outputFileName(String(args?.name ?? ''), 'xlsx'), args?.save_path));
      case 'docraptor_create_xlsx_from_rows': {
        const content = htmlTable(
          typeof args?.name === 'string' ? args.name : undefined,
          Array.isArray(args?.headers) ? (args.headers as string[]) : undefined,
          rowsFrom(args),
        );
        return json(await deliver(
          await createDocument({ name: String(args?.name ?? ''), type: 'xlsx', documentContent: content, test: typeof args?.test === 'boolean' ? args.test : undefined }),
          outputFileName(String(args?.name ?? ''), 'xlsx'),
          args?.save_path,
        ));
      }
      case 'docraptor_create_report': {
        const title = String(args?.title ?? '').trim();
        if (title === '') throw new Error('title is required');
        const content = buildStyledReportHtml(
          title,
          typeof args?.meta === 'string' ? args.meta : undefined,
          Array.isArray(args?.headers) ? (args.headers as string[]) : undefined,
          rowsFrom(args),
        );
        return json(await deliver(
          await createDocument({ name: title, type: 'pdf', documentContent: content, test: typeof args?.test === 'boolean' ? args.test : undefined }),
          outputFileName(title, 'pdf'),
          args?.save_path,
        ));
      }
      case 'docraptor_create_async':
        return json(await createAsyncDocument(baseOpts(args)));
      case 'docraptor_async_status':
        return json(await fetchStatusJson(String(args?.status_url ?? '')));
      case 'docraptor_async_fetch':
        return json(await deliver(await fetchDocumentBytes(String(args?.download_url ?? '')), 'document', args?.save_path));
      case 'docraptor_create_production': {
        if (args?.confirm !== true) {
          throw new Error('production render (test: false) spends credits; call again with confirm: true');
        }
        const opts = { ...baseOpts(args), type: (args?.type as DocType) ?? 'pdf', test: false };
        return json(await deliver(await createDocument(opts), outputFileName(opts.name, opts.type), args?.save_path));
      }
      case 'docraptor_test_ping':
        return json(await deliver(
          await createDocument({
            name: 'docraptor-mcp ping',
            type: 'pdf',
            documentContent: '<html><body><p>docraptor-mcp test ping</p></body></html>',
            test: true,
          }),
          'docraptor-mcp-ping.pdf',
          undefined,
        ));
      case 'docraptor_validate_html': {
        const html = String(args?.html ?? '');
        return json(validateHtml(html));
      }
      case 'docraptor_check_source_url':
        return json(await checkSourceUrl(String(args?.url ?? '')));
      default:
        return fail(new Error(`unknown tool: ${name}`));
    }
  } catch (err) {
    return fail(err);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);