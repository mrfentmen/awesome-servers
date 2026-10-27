import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { downloadStats, maintainerSearch, npmsScore, search, packageInfo, versionInfo } from './api.js';
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'npm-search-mcp', version: '1.0.0' });
    server.registerTool('search', {
        title: "Search",
        description: 'Search npm packages.',
        inputSchema: z.object({ query: z.string().describe('Search terms.').optional(), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('packageInfo', {
        title: "Package Info",
        description: 'Details for one npm package.',
        inputSchema: z.object({ name: z.string().describe('Package name.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await packageInfo(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('versionInfo', {
        title: "Version Info",
        description: 'One version: tarball, size, deps.',
        inputSchema: z.object({ name: z.string().describe('Package name.'), version: z.string().describe('Version.') }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await versionInfo(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('downloadStats', {
        title: "Download Stats",
        description: 'Download counts for a period.',
        inputSchema: z.object({ name: z.string().describe('Package name.'), period: z.string().describe('last-day, last-week or last-month.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await downloadStats(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('maintainerSearch', {
        title: "Maintainer Search",
        description: 'Packages by one maintainer.',
        inputSchema: z.object({ maintainer: z.string().describe('npm username.'), limit: z.number().describe('Max results.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await maintainerSearch(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool('npmsScore', {
        title: "npms Score",
        description: 'Quality/popularity/maintenance score and dependents.',
        inputSchema: z.object({ name: z.string().describe('Package name.') }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await npmsScore(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
