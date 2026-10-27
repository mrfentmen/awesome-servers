import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { node, nodes, preprint_landscape } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "osf-mcp", version: "1.0.0" });
    server.registerTool("nodes", {
        title: "Nodes",
        description: "Recent public nodes.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await nodes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("node", {
        title: "Node",
        description: "Get a node by id.",
        inputSchema: z.object({ id: z.string().describe("Node id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await node(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("preprint_search", {
        title: "Search preprints",
        description: "Search OSF preprints by a word or phrase in the title, optionally restricted to one provider subdomain such as psyarxiv, engrxiv or lawarchive, newest first, and report the true total from the index rather than the length of the page returned. The existing tools only read projects and report how many rows arrived rather than how many exist, so a preprint is not reachable through them at all.",
        inputSchema: z.object({
            title: z.string().min(1).max(200).describe("Word or phrase to look for in the title, matched as a substring."),
            provider: z.string().optional().describe("Provider subdomain, for example psyarxiv, engrxiv or lawarchive. Not a display name."),
            limit: z.number().int().min(1).max(50).optional().describe("How many to list. Default 10."),
        }),
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
    server.registerTool("preprint_record", {
        title: "Preprint record",
        description: "Read one OSF preprint in full: its provider, version and whether it is still the latest, publication state, DOI, the gap in days between submission and publication which is the provider's moderation lag, whether it has ever been withdrawn, its license, subjects, tags and abstract, and the list of relationships OSF holds against it with the version history and identifier links. The existing node tool covers projects, not preprints.",
        inputSchema: z.object({
            id: z.string().describe("OSF preprint id, for example 'xa9b7_v1'. Read it off a preprint_search result."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement record locally (paywall removed)
        try {
            return textError("Not yet implemented: record");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("preprint_landscape", {
        title: "Preprint landscape",
        description: "Report the shape of the OSF preprint feed rather than a list of it: the true index total against the page examined, the publication date range and the busiest day, how many are marked published, how many carry a DOI, how many are superseded revisions, the provider mix, the commonest subjects and tags, and how much of the tag vocabulary appears only once. Optionally narrowed to one provider subdomain.",
        inputSchema: z.object({
            provider: z.string().optional().describe("Provider subdomain, for example psyarxiv, engrxiv or lawarchive."),
            limit: z.number().int().min(10).max(100).optional().describe("How many of the newest preprints to examine. Default 100."),
        }),
        annotations: READ_ONLY,
    }, async ({ provider, limit }) => {
        try {
            return text(await preprint_landscape({ provider, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("preprint_contributors", {
        title: "Preprint contributors",
        description: "Read the author roster OSF holds against a preprint: everyone in the recorded author order with the true roster size out of the index, which of them are flagged as appearing in the citation, their permission on the record, and the OSF user id behind each name, or the fact that a contributor has no registered account. preprint_record names contributors only as one relationship worth following up and fetches none of it.",
        inputSchema: z.object({ id: z.string().describe("OSF preprint id, for example 'xa9b7_v1'. Read it off a preprint_search result.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement contributors locally (paywall removed)
        try {
            return textError("Not yet implemented: contributors");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "osf-mcp";
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
