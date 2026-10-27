#!/usr/bin/env node
/**
 * ipdata-mcp - IP intelligence through the ipdata.co API.
 *
 * Tools:
 *  - ipdata_lookup        : full profile for one IP (or the caller's own IP)
 *  - ipdata_self          : convenience full profile for the caller's own IP
 *  - ipdata_location      : sliced location answer
 *  - ipdata_timezone      : sliced timezone block
 *  - ipdata_currency      : sliced currency block
 *  - ipdata_languages     : sliced languages list
 *  - ipdata_carrier       : sliced mobile-carrier block
 *  - ipdata_asn           : sliced ASN block
 *  - ipdata_company       : sliced company block
 *  - ipdata_threat        : sliced threat-intelligence block
 *  - ipdata_vpn           : sliced VPN detection block
 *  - ipdata_threat_summary: compact fraud-triage view
 *  - ipdata_bulk          : up to 50 IPs, full profiles
 *  - ipdata_bulk_country  : up to 50 IPs, light ip -> country rows only
 *
 * Every tool is one real ipdata call (or the same bulk call, reduced
 * client-side). The sliced tools exist so an agent asks for the block it
 * needs instead of a full profile every time.
 *
 * The key is read from IPDATA_API_KEY; set IPDATA_EU=1 to route through the
 * EU endpoint so end-user IPs stay in the EU.
 *
 * First-party MCP coverage check (2026-10-23): the ipdata GitHub org ships
 * client libraries only; no official MCP server, and no MCP package on npm
 * under this name. See mcp/MISSING.md for the log.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ipdataBulk, ipdataGet } from './api.js';
import { FIELD_SETS, bulkCountryRows, pickFields, threatSummary } from './util.js';

const server = new Server(
  { name: 'ipdata-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

const IP_SCHEMA = {
  type: 'object',
  properties: {
    ip: { type: 'string', description: 'IPv4 or IPv6 address; omit for the caller\'s own IP' },
  },
  additionalProperties: false,
};

const BULK_SCHEMA = {
  type: 'object',
  properties: {
    ips: { type: 'array', items: { type: 'string' }, maxItems: 50, description: 'IP addresses to look up' },
  },
  required: ['ips'],
  additionalProperties: false,
};

/** Sliced tools: one ipdata call each, keeping only the named top-level fields. */
const SLICED_TOOLS: Record<string, string[]> = {
  ipdata_location: FIELD_SETS.location,
  ipdata_timezone: FIELD_SETS.timezone,
  ipdata_currency: FIELD_SETS.currency,
  ipdata_languages: FIELD_SETS.languages,
  ipdata_carrier: FIELD_SETS.carrier,
  ipdata_asn: FIELD_SETS.asn,
  ipdata_company: FIELD_SETS.company,
  ipdata_threat: FIELD_SETS.threat,
  ipdata_vpn: FIELD_SETS.vpn,
};

const SLICED_DESCRIPTIONS: Record<string, string> = {
  ipdata_location: 'Where the IP is: city, region, country, continent, lat/long, postal code and timezone name.',
  ipdata_timezone: "The IP's timezone block: name, UTC offset, current time and date.",
  ipdata_currency: "The IP's country currency block: code, name, symbol, plural.",
  ipdata_languages: "The languages spoken in the IP's country.",
  ipdata_carrier: 'The mobile carrier block for the IP (name, MCC, MNC) when it is on a mobile network.',
  ipdata_asn: 'The ASN block: autonomous system number, type, domain, name and route.',
  ipdata_company: 'The company block: the organisation registered for the IP, its domain and type.',
  ipdata_threat: 'The threat-intelligence block: tor, proxy, anonymous, known attacker/abuser, cloud provider, bogon, mobile.',
  ipdata_vpn: 'The VPN detection block for the IP (availability depends on the account tier).',
};

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
    name: 'ipdata_self',
    description: "Convenience full profile for the caller's own IP - answers 'which network am I on right now'.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'ipdata_threat_summary',
    description:
      'Compact fraud-triage view of one IP: is it a proxy/VPN/Tor/cloud provider, who owns it ' +
      '(ASN + company), which mobile carrier, and a one-line location. Cheaper to read than the full profile.',
    inputSchema: { ...IP_SCHEMA },
  },
  {
    name: 'ipdata_bulk',
    description: 'Look up 1-50 IP addresses in one call. Returns an array of full profiles, one per IP.',
    inputSchema: { ...BULK_SCHEMA },
  },
  {
    name: 'ipdata_bulk_country',
    description:
      'Bulk lookup reduced to light rows (ip + country_code only) - for classifying many IPs by country ' +
      'without burning context on full profiles.',
    inputSchema: { ...BULK_SCHEMA },
  },
  ...Object.keys(SLICED_TOOLS).map((name) => ({
    name,
    description: SLICED_DESCRIPTIONS[name],
    inputSchema: { ...IP_SCHEMA },
  })),
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params as { name: string; arguments?: Record<string, unknown> };
  const json = (data: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
  const fail = (err: unknown) => ({
    isError: true,
    content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
  });
  const targetIp = typeof args?.ip === 'string' ? args.ip : undefined;
  try {
    switch (name) {
      case 'ipdata_lookup': {
        const data = (await ipdataGet(targetIp)) as Record<string, unknown>;
        const fields = Array.isArray(args?.fields) ? (args.fields as string[]) : undefined;
        return json(pickFields(data, fields));
      }
      case 'ipdata_self':
        return json(await ipdataGet());
      case 'ipdata_threat_summary': {
        const data = (await ipdataGet(targetIp)) as Record<string, unknown>;
        return json(threatSummary(data));
      }
      case 'ipdata_bulk':
        return json(await ipdataBulk(args?.ips));
      case 'ipdata_bulk_country':
        return json(bulkCountryRows(await ipdataBulk(args?.ips)));
      default: {
        const fields = SLICED_TOOLS[name];
        if (!fields) return fail(new Error(`unknown tool: ${name}`));
        const data = (await ipdataGet(targetIp)) as Record<string, unknown>;
        return json(pickFields(data, fields));
      }
    }
  } catch (err) {
    return fail(err);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);