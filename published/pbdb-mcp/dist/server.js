import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { occurrences, taxa } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "pbdb-mcp", version: "1.0.0" });
    server.registerTool("occurrences", {
        title: "Occurrences",
        description: "Fossil occurrences for a taxon.",
        inputSchema: z.object({ taxon: z.string().describe("Taxon name like Triceratops."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await occurrences(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("taxa", {
        title: "Taxa",
        description: "Information about a taxon.",
        inputSchema: z.object({ name: z.string().describe("Taxon name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await taxa(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("taxon_ancestry", {
        title: "Taxon ancestry",
        description: "A taxon's full parent chain from the Paleobiology Database with rank and class, which the occurrence and taxa lookups never walk.",
        inputSchema: z.object({ name: z.string().describe("Taxon name, e.g. Canis."), limit: z.number().describe("Max records.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement ancestry locally (paywall removed)
        try {
            return textError("Not yet implemented: ancestry");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("occurrence_list", {
        title: "Occurrence list",
        description: "A taxon's fossil occurrences from the Paleobiology Database with age, class and optionally collection, continent and country, which the occurrence tool cannot filter by name.",
        inputSchema: z.object({ name: z.string().describe("Taxon name, e.g. Tyrannosaurus."), limit: z.number().describe("Max occurrences.").optional(), showLoc: z.boolean().describe("Include collection and location.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement list locally (paywall removed)
        try {
            return textError("Not yet implemented: list");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "pbdb-mcp";
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
