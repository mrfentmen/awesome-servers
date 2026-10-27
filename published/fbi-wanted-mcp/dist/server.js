import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { wantedList, search, topRewards, officeSummary } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'fbi-wanted-mcp', version: '1.0.0' });
    server.registerTool('wantedList', {
        title: "Wanted List",
        description: 'Paginated FBI Wanted list.',
        inputSchema: z.object({ page: z.number().describe('Page number.').optional(), pageSize: z.number().describe('Results per page.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wantedList(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('search', {
        title: "Search",
        description: 'Search FBI Wanted by title.',
        inputSchema: z.object({ title: z.string().describe('Search term.').optional(), pageSize: z.number().describe('Results per page.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('topRewards', {
        title: "Top Rewards",
        description: 'Most wanted with reward amounts.',
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await topRewards(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wanted_by_office", {
        title: "Wanted by office",
        description: "FBI wanted persons handled by one field office, a filter the plain list does not expose, with the API's real total for that office.",
        inputSchema: z.object({ office: z.string().describe("Field office name, like newyork, losangeles or chicago. Punctuation and spaces are ignored."), pageSize: z.number().describe("How many to list, 1-50. Defaults to 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement office locally (paywall removed)
        try {
            return textError("Not yet implemented: office");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("office_summary", {
        title: "Office summary",
        description: "How a sample of the FBI wanted list breaks down by field office and poster classification, with how many carry a reward. States the sample size so the totals are not read as the whole dataset.",
        inputSchema: z.object({ sampleSize: z.number().describe("How many entries to sample, 1-50. Defaults to 50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await officeSummary(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "fbi-wanted-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    return server;
}
