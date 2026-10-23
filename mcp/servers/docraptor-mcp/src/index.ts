#!/usr/bin/env node
/**
 * docraptor-mcp - HTML-to-PDF/XLSX documents through the DocRaptor API.
 *
 * Tools:
 *  - docraptor_create_document: render one document from HTML content or a
 *    URL; default is DocRaptor TEST mode so nothing bills until you ask.
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
import { createDocument } from './api.js';
import { BASE64_RETURN_LIMIT, outputFileName } from './util.js';

const server = new Server(
  { name: 'docraptor-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

const TOOLS = [
  {
    name: 'docraptor_create_document',
    description:
      'Generate ONE PDF or XLSX document from HTML (document_content) or a public URL (document_url). ' +
      'Defaults to test=true (free, watermarked test documents); set test=false for production documents, which use credits. ' +
      'Give save_path to write the file to disk; otherwise small documents come back as base64.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'document name; also becomes the default file name' },
        type: { type: 'string', enum: ['pdf', 'xlsx'] },
        document_content: { type: 'string', description: 'the HTML/CSV source of the document' },
        document_url: { type: 'string', description: 'a public URL to render instead of inline content' },
        test: { type: 'boolean', default: true, description: 'test documents are free and watermarked' },
        base_url: { type: 'string', description: 'base URL for relative links in the HTML' },
        http_timeout: { type: 'integer', minimum: 1, maximum: 60, description: 'seconds' },
        insecure: { type: 'boolean', description: 'allow self-signed SSL certificates when fetching assets' },
        javascript: { type: 'boolean', description: 'run JavaScript while rendering (PDF only)' },
        save_path: { type: 'string', description: 'absolute or relative path to write the document to' },
      },
      required: ['name', 'type'],
      additionalProperties: false,
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params as { name: string; arguments?: Record<string, unknown> };
  const json = (data: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
  const fail = (err: unknown) => ({
    isError: true,
    content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
  });
  try {
    if (name === 'docraptor_create_document') {
      const opts = {
        name: String(args?.name ?? ''),
        type: args?.type as 'pdf' | 'xlsx',
        documentContent: typeof args?.document_content === 'string' ? args.document_content : undefined,
        documentUrl: typeof args?.document_url === 'string' ? args.document_url : undefined,
        test: typeof args?.test === 'boolean' ? args.test : undefined,
        baseUrl: typeof args?.base_url === 'string' ? args.base_url : undefined,
        httpTimeout: args?.http_timeout as number | undefined,
        insecure: typeof args?.insecure === 'boolean' ? args.insecure : undefined,
        javascript: typeof args?.javascript === 'boolean' ? args.javascript : undefined,
      };
      const { bytes, contentType, request } = await createDocument(opts);
      const fileName = outputFileName(opts.name, opts.type);
      if (typeof args?.save_path === 'string' && args.save_path.trim() !== '') {
        const path = args.save_path.trim();
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, bytes);
        return json({ ok: true, saved_to: path, bytes: bytes.length, content_type: contentType, request });
      }
      if (bytes.length > BASE64_RETURN_LIMIT) {
        return fail(
          new Error(`document is ${bytes.length} bytes; pass save_path to write it to disk instead of inlining base64`),
        );
      }
      return json({
        ok: true,
        suggested_file_name: fileName,
        bytes: bytes.length,
        content_type: contentType,
        base64: bytes.toString('base64'),
        request,
      });
    }
    return fail(new Error(`unknown tool: ${name}`));
  } catch (err) {
    return fail(err);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
