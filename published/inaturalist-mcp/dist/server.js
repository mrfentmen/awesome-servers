import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { recentObservations, searchSpecies } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "inaturalist-mcp", version: "1.0.0" });
    server.registerTool("search_species", {
        title: "Search species",
        description: "Search species by name.",
        inputSchema: z.object({ query: z.string().describe("Species name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchSpecies(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_observations", {
        title: "Recent observations",
        description: "Recent observations of a species.",
        inputSchema: z.object({ taxonId: z.number().describe("iNaturalist taxon ID."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recentObservations(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("places", {
        title: "Places",
        description: "Look a place up in iNaturalist's gazetteer, with its id, slug, coordinates and the region it sits in.",
        inputSchema: z.object({ query: z.string().describe("Place name, e.g. york."), limit: z.number().describe("Max places.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement places locally (paywall removed)
        try {
            return textError("Not yet implemented: places");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("species_observations", {
        title: "Observations by name",
        description: "Recent iNaturalist observations of a species given in words, optionally narrowed to research grade and to observations that carry a photo.",
        inputSchema: z.object({ name: z.string().describe("Species, e.g. monarch."), quality: z.string().describe("needs_id, casual or research.").optional(), photos: z.boolean().describe("Only observations with a photo.").optional(), limit: z.number().describe("Max observations.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement observations locally (paywall removed)
        try {
            return textError("Not yet implemented: observations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("observation_stats", {
        title: "Observation stats",
        description: "How many observations iNaturalist holds for a taxon and how they split across casual, needs-id and research grade.",
        inputSchema: z.object({ name: z.string().describe("Species, e.g. monarch.").optional(), id: z.number().describe("Numeric taxon id.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement stats locally (paywall removed)
        try {
            return textError("Not yet implemented: stats");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "inaturalist-mcp";
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
