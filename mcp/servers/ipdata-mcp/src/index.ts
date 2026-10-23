#!/usr/bin/env node
/**
 * ipdata-mcp - IP intelligence through the ipdata.co API.
 *
 * Tools:
 *  - ipdata_lookup        : full profile for one IP (or the caller's own IP)
 *  - ipdata_bulk          : up to 50 IPs in one call
 *  - ipdata_threat_summary: compact fraud-triage view (threat/ASN/carrier/VPN)
 *
 * The key is read from IPDATA_API_KEY; set IPDATA_EU=1 to route through the
 * EU endpoint so end-user IPs stay in the EU. No other state, no paywall in
 * the server itself - the vendor's free tier applies.
 *
 * First-party MCP coverage check (2026-10-23): the ipdata GitHub org ships
 * client libraries only; no official MCP server, and no MCP package on npm
 * under this name. See mcp/MISSING.md for the log.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ipdataBulk, ipdataGet } from './api.js';
import { pickFields, threatSummary } from './util.js';

const server = new Server(
  { name: 'ipdata-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

const TOOLS = [
  {
    name: 'ipdata_lookup',
    description:
      'Full ipdata profile for one IP address: geolocation, timezone, currency, languages, ' +
      'carrier, ASN, company, threat flags and VPN signal. Omit `ip` to look up the caller\'s own IP. ' +
      'Pass `fields` to keep only named top-level fields.',
    inputSchema: {
      type: 'object',
      properties: {
        ip: { type: 'string', description: 'IPv4 or IPv6 address; omit for the caller\'s own IP' },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional top-level field whitelist (e.g. ["ip","country_name","threat"])',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'ipdata_bulk',
    description:
      'Look up 1-50 IP addresses in one call. Returns an array of full profiles, one per IP.',
    inputSchema: {
      type: 'object',
      properties: {
        ips: { type: 'array', items: { type: 'string' }, maxItems: 50, description: 'IP addresses to look up' },
      },
      required: ['ips'],
      additionalProperties: false,
    },
  },
  {
    name: 'ipdata_threat_summary',
    description:
      'Compact fraud-triage view of one IP: is it a proxy/VPN/Tor/cloud provider, who owns it ' +
      '(ASN + company), which mobile carrier, and a one-line location. Cheaper to read than the full profile.',
    inputSchema: {
      type: 'object',
      properties: {
        ip: { type: 'string', description: 'IPv4 or IPv6 address; omit for the caller\'s own IP' },
      },
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
      case 'ipdata_lookup': {
        const data = (await ipdataGet(typeof args?.ip === 'string' ? args.ip : undefined)) as Record<string, unknown>;
        const fields = Array.isArray(args?.fields) ? (args.fields as string[]) : undefined;
        return json(pickFields(data, fields));
      }
      case 'ipdata_bulk':
        return json(await ipdataBulk(args?.ips));
      case 'ipdata_threat_summary': {
        const data = (await ipdataGet(typeof args?.ip === 'string' ? args.ip : undefined)) as Record<string, unknown>;
        return json(threatSummary(data));
      }
      default:
        return fail(new Error(`unknown tool: ${name}`));
    }
  } catch (err) {
    return fail(err);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
