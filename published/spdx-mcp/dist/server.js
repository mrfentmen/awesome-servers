import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { find, format, get, SpdxError } from "./api.js";
const text = (s) => ({ content: [{ type: "text", text: s }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({ name: "spdx-mcp", version: "1.0.0" });
    const serverName = "spdx-mcp";
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
    server.registerTool("search_licenses", {
        title: "Search licenses",
        description: "Search SPDX license identifiers and names.",
        inputSchema: z.object({ query: z.string().min(1) }),
        annotations: READ_ONLY,
    }, async ({ query }) => { try {
        return text(format(await find(query)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("get_license", {
        title: "Get license",
        description: "Get SPDX metadata for an exact license identifier such as MIT, Apache-2.0, or GPL-3.0-only.",
        inputSchema: z.object({ id: z.string().min(1) }),
        annotations: READ_ONLY,
    }, async ({ id }) => { try {
        const x = await get(id);
        return text(x ? format([x]) : `No SPDX license named ${id}.`);
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("license_exceptions", {
        title: "License exceptions",
        description: "Search the SPDX license exception list: named exceptions to license restrictions, with the example text each one covers.",
        inputSchema: z.object({ query: z.string().min(1).describe("Search term, e.g. classpath or linking exception.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement exceptions locally (paywall removed)
        try {
            return textError("Not yet implemented: exceptions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
export { SpdxError };
