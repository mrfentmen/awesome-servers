#!/usr/bin/env node
/**
 * neverbounce-mcp - email verification through the NeverBounce API (ZoomInfo).
 *
 * Tools:
 *  - nb_account_info        : raw account/info envelope (status, credits, usage)
 *  - nb_account_usage       : just the credit figures
 *  - nb_verify_email        : one /single/check (result, flags, correction)
 *  - nb_verify_email_strict : the same answer plus a safe/risky/dead/unknown verdict
 *  - nb_poe_confirm         : Proof of Email token confirmation
 *  - nb_job_create          : create a bulk job from a dashboard-uploaded list
 *  - nb_job_start           : start a created job
 *  - nb_job_status          : poll a job
 *  - nb_job_results         : page through per-email results
 *  - nb_job_results_summary : one page + a per-result tally
 *  - nb_job_download        : JSON or CSV download payload for a finished job
 *  - nb_job_delete          : delete a bulk job (destructive, scoped to that job)
 *
 * Everything is driven by one static API key from NEVERBOUNCE_API_KEY.
 *
 * First-party MCP coverage check (2026-10-23): no official NeverBounce MCP
 * and no MCP package on npm under this name. See mcp/MISSING.md for the log.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { accountInfo, accountUsage, jobCreate, jobDelete, jobDownload, jobResults, jobResultsSummary, jobStart, jobStatus, poeConfirm, verifyEmail, verifyEmailVerdict, } from './api.js';
const server = new Server({ name: 'neverbounce-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });
const JOB_SCHEMA = {
    type: 'object',
    properties: { job_id: { type: 'string' } },
    required: ['job_id'],
    additionalProperties: false,
};
const TOOLS = [
    {
        name: 'nb_account_info',
        description: 'Raw NeverBounce account envelope: status, verification credits remaining, monthly usage and limit.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'nb_account_usage',
        description: 'Just the credit figures: credits remaining, monthly usage, monthly limit.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'nb_verify_email',
        description: 'Verify ONE email address: result (valid / invalid / disposable / catchall / unknown), flags ' +
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
        name: 'nb_verify_email_strict',
        description: 'The same verification plus a verdict line computed here: safe (send), risky (catchall/disposable - judge first), ' +
            'dead (do not send), unknown (retry later). For deciding whether an agent should send at all.',
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
        name: 'nb_poe_confirm',
        description: 'Confirm a Proof of Email (POE) token: pairs the transaction_id and token issued by the POE widget ' +
            'with the original single-check transaction.',
        inputSchema: {
            type: 'object',
            properties: {
                transaction_id: { type: 'string' },
                token: { type: 'string' },
            },
            required: ['transaction_id', 'token'],
            additionalProperties: false,
        },
    },
    {
        name: 'nb_job_create',
        description: 'Create a bulk verification job from an email list file or folder that was already uploaded through the ' +
            'NeverBounce dashboard. auto_parse defaults to true; run_sample optionally verifies a sample first.',
        inputSchema: {
            type: 'object',
            properties: {
                email_filename: { type: 'string', description: 'file name uploaded via the dashboard' },
                email_list_folder: { type: 'string', description: 'folder name uploaded via the dashboard' },
                auto_parse: { type: 'boolean', default: true },
                run_sample: { type: 'boolean', description: 'verify a small sample before the full run' },
                job_name: { type: 'string' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'nb_job_start',
        description: 'Start a created (parsed) bulk verification job.',
        inputSchema: { ...JOB_SCHEMA },
    },
    {
        name: 'nb_job_status',
        description: 'Poll the status of a bulk verification job.',
        inputSchema: { ...JOB_SCHEMA },
    },
    {
        name: 'nb_job_results',
        description: "Page through a finished job's per-email results: each row is an email with its verification result and flags.",
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
        name: 'nb_job_results_summary',
        description: "One page of a job's results reduced to a per-result tally (valid/invalid/...) plus the query_info totals. " +
            'For a quick health read of a finished job without pulling every row.',
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
        name: 'nb_job_download',
        description: 'Get the download payload for a finished job (file_format: json or csv).',
        inputSchema: {
            type: 'object',
            properties: {
                job_id: { type: 'string' },
                file_format: { type: 'string', enum: ['json', 'csv'], default: 'json' },
            },
            required: ['job_id'],
            additionalProperties: false,
        },
    },
    {
        name: 'nb_job_delete',
        description: 'Delete a bulk verification job (destructive for that job only).',
        inputSchema: { ...JOB_SCHEMA },
    },
];
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const json = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
    const fail = (err) => ({
        isError: true,
        content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    });
    try {
        switch (name) {
            case 'nb_account_info':
                return json(await accountInfo());
            case 'nb_account_usage':
                return json(await accountUsage());
            case 'nb_verify_email':
                return json(await verifyEmail(String(args?.email), args?.timeout));
            case 'nb_verify_email_strict':
                return json(await verifyEmailVerdict(String(args?.email), args?.timeout));
            case 'nb_poe_confirm':
                return json(await poeConfirm(args?.transaction_id, args?.token));
            case 'nb_job_create':
                return json(await jobCreate({
                    email_filename: typeof args?.email_filename === 'string' ? args.email_filename : undefined,
                    email_list_folder: typeof args?.email_list_folder === 'string' ? args.email_list_folder : undefined,
                    auto_parse: typeof args?.auto_parse === 'boolean' ? args.auto_parse : undefined,
                    run_sample: typeof args?.run_sample === 'boolean' ? args.run_sample : undefined,
                    job_name: typeof args?.job_name === 'string' ? args.job_name : undefined,
                }));
            case 'nb_job_start':
                return json(await jobStart(args?.job_id));
            case 'nb_job_status':
                return json(await jobStatus(args?.job_id));
            case 'nb_job_results':
                return json(await jobResults(args?.job_id, args?.start_page, args?.items_per_page));
            case 'nb_job_results_summary':
                return json(await jobResultsSummary(args?.job_id, args?.start_page, args?.items_per_page));
            case 'nb_job_download':
                return json(await jobDownload(args?.job_id, args?.file_format));
            case 'nb_job_delete':
                return json(await jobDelete(args?.job_id));
            default:
                return fail(new Error(`unknown tool: ${name}`));
        }
    }
    catch (err) {
        return fail(err);
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);
