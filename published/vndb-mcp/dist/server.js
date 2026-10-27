import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { VndbApiError, formatCharacter, formatRelease, formatVn, getReleases, getVn, searchCharacters, searchVns } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "vndb-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_vns", {
        title: "Search vns",
        description: "Search the Visual Novel Database for visual novels. " +
            "Sortable by rating (default), popularity, released date, or title.",
        inputSchema: z.object({
            query: z.string().describe("Search query, e.g. 'Muv-Luv' or 'nukige'"),
            sort: z
                .enum(["rating", "popularity", "released", "title"])
                .default("rating")
                .describe("Sort order"),
            results: z.number().int().min(1).max(15).default(8).describe("Max results"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, sort, results }) => {
        try {
            const vns = await searchVns(query, results, sort);
            if (vns.length === 0)
                return text(`No visual novels found for "${query}".`);
            const header = `Visual novels matching "${query}" (sorted by ${sort}):\n`;
            return text(header + vns.map((v, i) => `${i + 1}. ${formatVn(v)}`).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_vn", {
        title: "Get vn",
        description: "Get full details for a visual novel by its VNDB id (e.g. 'v17').",
        inputSchema: z.object({ id: z.string().describe("VNDB id like 'v17' or 'v311'") }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            const vn = await getVn(id);
            if (!vn)
                return text(`No visual novel with id "${id}".`);
            return text(formatVn(vn));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_characters", {
        title: "Search characters",
        description: "Search VNDB for characters by name or description text.",
        inputSchema: z.object({
            query: z.string().describe("Character name or trait, e.g. 'Sakura' or 'tsundere'"),
            results: z.number().int().min(1).max(15).default(8).describe("Max results"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, results }) => {
        try {
            const chars = await searchCharacters(query, results);
            if (chars.length === 0)
                return text(`No characters found for "${query}".`);
            return text(`Characters matching "${query}":\n` +
                chars.map((c, i) => `${i + 1}. ${formatCharacter(c)}`).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_vn_releases", {
        title: "Get vn releases",
        description: "List all releases (platforms, languages, catalog numbers) for a visual novel.",
        inputSchema: z.object({ vnId: z.string().describe("VNDB id like 'v17'") }),
        annotations: READ_ONLY,
    }, async ({ vnId }) => {
        try {
            const releases = await getReleases(vnId);
            if (releases.length === 0)
                return text(`No releases found for "${vnId}".`);
            return text(`Releases for ${vnId}:\n` +
                releases.map((r, i) => `${i + 1}. ${formatRelease(r)}`).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("producer_search", {
        title: "Producer search",
        description: "Search VNDB's producer and studio collection with original names, aliases and types, which the visual novel and character tools never return.",
        inputSchema: z.object({ query: z.string().describe("Producer or studio name."), limit: z.number().describe("Max producers.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement search locally (paywall removed)
        try {
            return textError("Not yet implemented: search");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("staff_search", {
        title: "Staff search",
        description: "Search VNDB's staff collection with original names, aliases and role type, which is how you find who is credited on a visual novel.",
        inputSchema: z.object({ query: z.string().describe("Staff name."), limit: z.number().describe("Max staff.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement search locally (paywall removed)
        try {
            return textError("Not yet implemented: search");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "vndb-mcp";
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
    if (e instanceof VndbApiError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
