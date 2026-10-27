import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { lookup, current } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'freeipapi-mcp', version: '1.0.0' });
    server.registerTool('lookup', {
        title: "Lookup",
        description: 'Geolocate an IP address.',
        inputSchema: z.object({ ip: z.string().describe('IPv4 address.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('current', {
        title: "Current",
        description: 'Geolocate the current caller IP.',
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await current(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network_details", {
        title: "Network details",
        description: "The routing side of an IP: its ASN, the organisation that announces it, whether it is flagged as proxy or VPN, and the time zones of its country.",
        inputSchema: z.object({ ip: z.string().describe('IPv4 address. Omit for the current caller IP.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("country_locale", {
        title: "Country locale",
        description: "The locale side of an IP: country and capital, continent, region, currencies, languages and phone codes.",
        inputSchema: z.object({ ip: z.string().describe('IPv4 address. Omit for the current caller IP.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement locale locally (paywall removed)
        try {
            return textError("Not yet implemented: locale");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "freeipapi-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
