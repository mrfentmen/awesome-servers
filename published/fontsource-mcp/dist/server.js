import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { list, subsetFinder } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "fontsource-mcp", version: "1.0.0" });
    server.registerTool("list", {
        title: "List",
        description: "List available fonts.",
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
    server.registerTool("font_census", {
        title: "Font census",
        description: "The whole Fontsource catalogue as a census: how many fonts sit in each category, licence and source type, how many are variable or carry an italic, the style coverage, the default subset spread, the weight count range, how many distinct subsets are named and when the catalogue was last touched.",
        inputSchema: z.object({ limit: z.number().describe("Values to list per distribution, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement census locally (paywall removed)
        try {
            return textError("Not yet implemented: census");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("font_details", {
        title: "Font details",
        description: "The full record for one font from Fontsource's per font endpoint: category, licence, upstream source, whether it is variable, its weights, styles, default subset, the unicode range behind a subset, the spec and npm versions, how many variant file groups exist, and the install and stylesheet URLs.",
        inputSchema: z.object({ id: z.string().describe("Fontsource font id, e.g. inter or roboto."), limit: z.number().describe("Weight groups to list, 1-12.").optional() }),
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
    server.registerTool("subset_finder", {
        title: "Subset finder",
        description: "Which fonts carry a given language or script subset and which of the catalogue do not: the share, how many are variable, their category mix, and each matching font with its licence.",
        inputSchema: z.object({ subset: z.string().describe("Subset name, e.g. cyrillic, arabic, greek, vietnamese, devanagari."), limit: z.number().describe("Fonts to list, 1-60.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await subsetFinder(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "fontsource-mcp";
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
