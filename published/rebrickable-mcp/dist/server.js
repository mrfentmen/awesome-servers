import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatSet, getSet, RebrickableError, searchSets, setParts, colorRoster } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "rebrickable-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_sets", {
        title: "Search sets",
        description: "LEGO sets by keyword with years and part counts.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'Millennium Falcon'"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const rows = await searchSets(query, limit);
            if (rows.length === 0)
                return text(`No LEGO sets for "${query}".`);
            return text(rows.map((s, i) => formatSet(s, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_set", {
        title: "Get set",
        description: "One LEGO set with part count and link.",
        inputSchema: z.object({
            number: z.string().describe("Set number, e.g. '75192-1' (use search_sets)"),
        }),
        annotations: READ_ONLY,
    }, async ({ number }) => {
        try {
            return text(await getSet(number));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("set_parts", {
        title: "Set parts",
        description: "Parts inventory of one set with colors and quantities.",
        inputSchema: z.object({
            number: z.string().describe("Set number, e.g. '75192-1'"),
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ number, limit }) => {
        try {
            const rows = await setParts(number, limit);
            if (rows.length === 0)
                return text(`No parts for set ${number}.`);
            return text(rows.map((p, i) => `${i + 1}. ${p}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("era_census", {
        title: "LEGO era census",
        description: "How Rebrickable's set catalogue is spread over time: sets per decade, median and mean parts per set, and the themes that fill each decade. Reads Rebrickable's public sets and themes downloads, no API key.",
        inputSchema: z.object({
            fromYear: z.number().describe("First year, 1900-2100.").optional(),
            toYear: z.number().describe("Last year, 1900-2100.").optional(),
            limit: z.number().describe("Leading themes to name per decade, 1-12.").optional(),
        }),
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
    server.registerTool("theme_tree", {
        title: "LEGO theme tree",
        description: "The Rebrickable theme hierarchy around a theme name: its path to the root, how many sets are filed under it, and its child and grandchild themes with their set counts. Reads Rebrickable's public themes and sets downloads, no API key.",
        inputSchema: z.object({
            theme: z.string().describe("Theme name, e.g. Star Wars, Technic, Adventurers"),
            depth: z.number().describe("Levels of children to show, 1-4.").optional(),
            limit: z.number().describe("Max themes per level, 1-30.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tree locally (paywall removed)
        try {
            return textError("Not yet implemented: tree");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("color_roster", {
        title: "LEGO color roster",
        description: "Rebrickable's published colour table: each colour with its hex, transparency, set and part tallies and the years it was in use, ordered by how common it is, with the rarest in the filtered set. No API key.",
        inputSchema: z.object({
            minSets: z.number().describe("Only colours used in at least this many sets.").optional(),
            transparent: z.boolean().describe("Filter to transparent or opaque colours only.").optional(),
            limit: z.number().describe("Max colours to list, 1-60.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await colorRoster(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "rebrickable-mcp";
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
    if (e instanceof RebrickableError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
