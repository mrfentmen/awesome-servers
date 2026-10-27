import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { flag, list, resolveName } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "countryflags-mcp", version: "1.0.0" });
    server.registerTool("list", {
        title: "List",
        description: "List country flag codes.",
        inputSchema: z.object({ search: z.string().describe("Optional search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await list(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("flag", {
        title: "Flag",
        description: "Flag image URL for a country.",
        inputSchema: z.object({ code: z.string().describe("Country code like us.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await flag(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("flag_urls", {
        title: "Flag urls",
        description: "Every working size url for one flag code, checked against the live code list and restricted to the sizes that really exist. The unsized url the flag tool prints answers 404.",
        inputSchema: z.object({ code: z.string().describe("Country code like us, or a subdivision code like gb-eng."), sizes: z.string().describe("Comma separated sizes to show, like w320,256x192. Defaults to all 21 that exist.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement urls locally (paywall removed)
        try {
            return textError("Not yet implemented: urls");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("resolve_name", {
        title: "Resolve name",
        description: "Find flag codes by country or region name and get real image urls for each, instead of guessing the two letter code.",
        inputSchema: z.object({ name: z.string().describe("Country or region name or part of one, like united or korea."), sizes: z.string().describe("Comma separated sizes to show, like w320. Defaults to all 21 that exist.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await resolveName(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "countryflags-mcp";
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
