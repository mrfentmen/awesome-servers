import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { avatar, robohashCompare } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: 'robohash-mcp', version: '1.0.0' });
    server.registerTool('avatar', {
        title: "Avatar",
        description: 'RoboHash robot avatar URL.',
        inputSchema: z.object({ text: z.string().describe('Seed text.').optional(), size: z.number().describe('Pixels, default 300.').optional(), set: z.number().describe('Robot set 1-5.').optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await avatar(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('robohash_variants', {
        title: "RoboHash variants",
        description: "Fetch every documented RoboHash parameter variant for one seed - five image formats, five robot sets, two background sets - and report status, content type, size and whether each is actually distinct.",
        inputSchema: z.object({ text: z.string().describe('Seed text.').optional(), size: z.number().int().min(32).max(1024).default(200) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement variants locally (paywall removed)
        try {
            return textError("Not yet implemented: variants");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool('robohash_compare', {
        title: "RoboHash compare",
        description: "Check that a RoboHash seed is deterministic by requesting it twice, then compare other seeds byte for byte to find which ones render the same robot.",
        inputSchema: z.object({ text: z.string().describe('Reference seed.').optional(), otherSeeds: z.array(z.string()).max(6).describe('Seeds to compare against the reference.').optional(), size: z.number().int().min(32).max(1024).default(200), set: z.number().int().min(1).max(5).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await robohashCompare(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "robohash-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
