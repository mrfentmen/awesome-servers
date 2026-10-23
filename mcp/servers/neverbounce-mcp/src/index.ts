#!/usr/bin/env node
/**
 * neverbounce-mcp - email verification through the NeverBounce API (ZoomInfo).
 *
 * Tools:
 *  - nb_account_info  : credits left / monthly usage
 *  - nb_verify_email  : one /single/check with timeout + result + flags
 *  - nb_job_status    : poll a bulk verification job
 *  - nb_job_results   : page through a finished job's per-email results
 *  - nb_job_delete    : delete a finished job
 *
 * Deliberately out of scope: jobs/create (needs a file uploaded through the
 * vendor's own workflow first). Everything here is driven by one static API
 * key from NEVERBOUNCE_API_KEY.
 *
 * First-party MCP coverage check (2026-10-23): no official NeverBounce MCP
 * and no MCP package on npm under this name (only their plain API client).
 * See mcp/MISSING.md for the log.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { accountInfo, jobDelete, jobResults, jobStatus, verifyEmail } from './api.js';

const server = new Server(
  { name: 'neverbounce-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

const TOOLS = [
  {
    name: 'nb_account_info',
    description: 'NeverBounce account snapshot: verification credits remaining and monthly usage.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'nb_verify_email',
    description:
      'Verify ONE email address: result (valid / invalid / disposable / catchall / unknown), flags ' +
      '(free provider, role account, disposable host, spamtrap, bounce), and a suggested correction if any.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        timeout: { type: 'integer', minimum: 3, maximum: 30, default: 30, description: 'seconds' },
      },
      required: ['email'],
      additionalProperties: false,
    },
  },
  {
    name: 'nb_job_status',
    description: 'Poll the status of a bulk verification job (created in the NeverBounce dashboard).',
    inputSchema: {
      type: 'object',
      properties: { job_id: { type: 'string' } },
      required: ['job_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'nb_job_results',
    description:
      'Page through a finished job\'s per-email results: each row is an email with its verification result and flags.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
        start_page: { type: 'integer', minimum: 1 },
        items_per_page: { type: 'integer', minimum: 1, maximum: 500 },
      },
      required: ['job_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'nb_job_delete',
    description: 'Delete a bulk verification job (destructive for that job only).',
    inputSchema: {
      type: 'object',
      properties: { job_id: { type: 'string' } },
      required: ['job_id'],
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
    switch (name) {
      case 'nb_account_info':
        return json(await accountInfo());
      case 'nb_verify_email':
        return json(await verifyEmail(String(args?.email), args?.timeout));
      case 'nb_job_status':
        return json(await jobStatus(args?.job_id));
      case 'nb_job_results':
        return json(await jobResults(args?.job_id, args?.start_page, args?.items_per_page));
      case 'nb_job_delete':
        return json(await jobDelete(args?.job_id));
      default:
        return fail(new Error(`unknown tool: ${name}`));
    }
  } catch (err) {
    return fail(err);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
