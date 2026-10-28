#!/usr/bin/env node
/**
 * pod-upload-mcp - browser-driven uploads for print-on-demand marketplaces.
 *
 * Tools:
 *  - pod_browser_status   : does a persistent browser session exist, current pages
 *  - pod_open_login       : open a marketplace login page; HUMAN types credentials
 *  - redbubble_upload_work: upload one design end-to-end (title/tags/desc/answers/save)
 *  - redbubble_list_works : list portfolio works (id + slug + edit href)
 *  - redbubble_probe_form : dump upload-form text-field diagnostics
 *  - teepublic_upload     : EXPERIMENTAL tee upload via the designer flow
 *
 * The server holds no credentials and never opens payment/payout screens.
 * Automation is explicitly unofficial for RB/TP; use for the artist's own
 * original work at human pace.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  getSession,
  closeSession,
  waitForHumanLogin,
  rbUploadWork,
  rbListWorks,
  rbProbeForm,
  tpUploadDesign,
} from './flows.js';
import { buildRbTags, tpTagsText, validateTitle } from './util.js';

const server = new Server(
  { name: 'pod-upload-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

const TOOLS = [
  {
    name: 'pod_browser_status',
    description: 'Report whether the persistent browser session is open and list page URLs.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'pod_open_login',
    description:
      'Open a marketplace login page in the persistent local browser and wait for the HUMAN to log in. ' +
      'Never call this with credentials - the human types them inside the visible window.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['redbubble', 'teepublic'] },
        timeout_seconds: { type: 'integer', default: 300, maximum: 900 },
      },
      required: ['platform'],
      additionalProperties: false,
    },
  },
  {
    name: 'redbubble_upload_work',
    description:
      'Upload ONE original design to the logged-in Redbubble portfolio (title, main tag, supporting tags, description; answers mature=No and rights-agreement internally; saves). Human pace, own artwork only.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        title: { type: 'string' },
        mainTag: { type: 'string' },
        supportingTags: { type: 'string', description: 'comma separated' },
        description: { type: 'string' },
      },
      required: ['filePath', 'title', 'mainTag', 'supportingTags'],
      additionalProperties: false,
    },
  },
  {
    name: 'redbubble_list_works',
    description: 'List uploaded works (id, slug, edit href) from the Redbubble manage-portfolio page.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'redbubble_probe_form',
    description: 'Dump the upload-form text-field diagnostics to repair upload selectors in the wild.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'teepublic_upload',
    description: 'EXPERIMENTAL: upload one design to TeePublic via the designer flow (title + tags).',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        title: { type: 'string' },
        tags: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['filePath', 'title', 'tags'],
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
      case 'pod_browser_status': {
        const ctx = await getSession();
        const pages = ctx.pages().map((p) => ({ url: p.url() }));
        return json({ ok: true, profile: process.env.POD_MCP_PROFILE || '~/.pod-upload-mcp/profile', pages });
      }
      case 'pod_open_login': {
        const platform = String(args?.platform);
        const target =
          platform === 'redbubble'
            ? 'https://www.redbubble.com/auth/login'
            : 'https://www.teepublic.com/users/sign_in';
        const heartbeat =
          platform === 'redbubble' ? 'https://www.redbubble.com/' : 'https://www.teepublic.com/';
        const res = await waitForHumanLogin(target, heartbeat, Number(args?.timeout_seconds || 300) * 1000);
        return json(res);
      }
      case 'redbubble_upload_work': {
        const res = await rbUploadWork({
          filePath: String(args?.filePath),
          title: String(args?.title),
          mainTag: String(args?.mainTag),
          supportingTags: String(args?.supportingTags),
          description: args?.description ? String(args.description) : undefined,
        });
        return json(res);
      }
      case 'redbubble_list_works': {
        return json(await rbListWorks());
      }
      case 'redbubble_probe_form': {
        return json(await rbProbeForm());
      }
      case 'teepublic_upload': {
        const res = await tpUploadDesign({
          filePath: String(args?.filePath),
          title: String(args?.title),
          tags: String(args?.tags),
          description: args?.description ? String(args.description) : undefined,
        });
        return json(res);
      }
      default:
        return json({ ok: false, error: `unknown tool ${name}` });
    }
  } catch (e) {
    return json({ ok: false, error: String(e).slice(0, 400) });
  }
});

process.on('SIGTERM', () => { void closeSession(); process.exit(0); });

await server.connect(new StdioServerTransport());
