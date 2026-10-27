import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTemplate, listTemplates, makeMeme, MemeError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "memegen-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_templates", {
        title: "List meme templates",
        description: "All memegen.link templates: ids, names, line counts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listTemplates();
            const top = rows.slice(0, 40);
            return text(`Meme templates (${rows.length} total, showing ${top.length}):\n\n` +
                top.map((t) => `${t.id} — ${t.name} (${t.lines} lines)`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("make_meme", {
        title: "Make captioned meme",
        description: "Build a captioned meme image URL from a template id and text lines. No fetching needed.",
        inputSchema: z.object({
            template: z.string().describe("Template id, e.g. 'drake', 'fry', 'buzz' (use list_templates)"),
            lines: z.array(z.string()).min(1).max(8).describe("Caption lines, top to bottom"),
        }),
        annotations: READ_ONLY,
    }, async ({ template, lines }) => {
        try {
            return text(makeMeme(template, lines));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_template", {
        title: "Get template",
        description: "One meme template: blank and example image URLs, line count.",
        inputSchema: z.object({
            id: z.string().describe("Template id, e.g. 'drake'"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const t = await getTemplate(id);
            return text(`${t.id} — ${t.name} (${t.lines} lines)${t.blank ? `\nBlank: ${t.blank}` : ""}${t.example ? `\nExample: ${t.example}` : ""}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_caption_fonts", {
        title: "List caption fonts",
        description: "Every caption font memegen.link can render with: font id, short alias and the font file behind it.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement fonts locally (paywall removed)
        try {
            return textError("Not yet implemented: fonts");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_quote", {
        title: "Random quote",
        description: "Fetch a random quote and its author from ZenQuotes, ready to use as meme caption text.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement quote locally (paywall removed)
        try {
            return textError("Not yet implemented: quote");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("template_styles", {
        title: "Template styles",
        description: "Discover a meme template's alternate visual styles and overlay slots, with preview URLs for each style.",
        inputSchema: z.object({ id: z.string().describe("Template id, for example drake.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement styles locally (paywall removed)
        try {
            return textError("Not yet implemented: styles");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "memegen-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof MemeError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
