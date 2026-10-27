import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, workDetail } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "wellcome-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search works.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_images", {
        title: "Search images",
        description: "Search the Wellcome Collection's digitised images: the work they come from, their IIIF image id, licence and aspect ratio.",
        inputSchema: z.object({ query: z.string().max(200).describe("Search terms."), limit: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement images locally (paywall removed)
        try {
            return textError("Not yet implemented: images");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_by_format", {
        title: "Search by format",
        description: "Search Wellcome works restricted to one format, with the total number of matches and each item's availability.",
        inputSchema: z.object({ query: z.string().max(200).describe("Search terms."), format: z.enum(["a", "k", "e", "j", "d", "m", "v"]).default("a").describe("Format letter: a books, k pictures, e maps, j e-journals, d journals, m CD-Roms, v e-books."), limit: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement format locally (paywall removed)
        try {
            return textError("Not yet implemented: format");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("work_detail", {
        title: "Work detail",
        description: "Retrieve a Wellcome catalogue work by id with contributors, production, subjects and bibliographic notes.",
        inputSchema: z.object({ id: z.string().regex(/^[a-z0-9]{8}$/).describe("Eight-character work id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await workDetail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("work_items", {
        title: "Work holdings",
        description: "Retrieve physical shelfmarks, digital locations, licences and access conditions for a Wellcome work.",
        inputSchema: z.object({ id: z.string().regex(/^[a-z0-9]{8}$/).describe("Eight-character work id."), limit: z.number().int().min(1).max(25).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement items locally (paywall removed)
        try {
            return textError("Not yet implemented: items");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("catalogue_facets", {
        title: "Catalogue facets",
        description: "Summarize a Wellcome search by format and subject counts using catalogue aggregations.",
        inputSchema: z.object({ query: z.string().min(1).max(200).describe("Catalogue search terms."), limit: z.number().int().min(1).max(20).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement facets locally (paywall removed)
        try {
            return textError("Not yet implemented: facets");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wellcome-mcp";
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
