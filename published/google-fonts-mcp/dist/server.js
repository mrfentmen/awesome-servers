import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listFonts, searchFonts, getFont, variableAxes, servedFontFaces } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "google-fonts-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_fonts", {
        title: "List fonts",
        description: "Most popular Google Fonts families, with categories.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listFonts(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_fonts", {
        title: "Search fonts",
        description: "Families matching a name, e.g. roboto.",
        inputSchema: z.object({
            query: z.string().describe("Name search."),
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchFonts(query, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_font", {
        title: "Get font",
        description: "One family: variants, subsets and font files.",
        inputSchema: z.object({
            family: z.string().describe("Family name, e.g. Roboto.")
        }),
        annotations: READ_ONLY,
    }, async ({ family }) => {
        try {
            return text(await getFont(family));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("variable_axes", {
        title: "Variable axes",
        description: "The variable-font axes Google Fonts exposes: the axis registry with each axis range and default, and the families that use them. Pass a family to see just that one.",
        inputSchema: z.object({
            family: z.string().describe("Font family, e.g. 'Inter'. Omit for the registry overview.").optional(),
            limit: z.number().int().min(1).max(25).default(12).describe("How many families to list in the overview."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await variableAxes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("served_font_faces", {
        title: "Served font faces",
        description: "The @font-face rules Google Fonts actually serves for a family and weight list: format, file URL, subset and font-display. No API key needed.",
        inputSchema: z.object({
            family: z.string().describe("Font family, e.g. Inter"),
            weights: z.string().describe("Comma separated weights, e.g. '400,700'. Defaults to 400."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await servedFontFaces(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "google-fonts-mcp";
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
