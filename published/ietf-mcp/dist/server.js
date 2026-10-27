import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, getDocument, listMeetings, searchDocuments, searchGroups, documentAuthors } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "ietf-mcp", version: "1.0.0" });
    server.registerTool("search_documents", {
        title: "Search documents",
        description: "Find IETF documents using the Datatracker name filter, with bounded pagination.",
        inputSchema: z.object({ query: z.string().min(1).max(120), limit: z.number().int().min(1).max(25).default(10), offset: z.number().int().min(0).max(1000).default(0) }),
        annotations: READ_ONLY,
    }, async ({ query, limit, offset }) => {
        try {
            return text(format(await searchDocuments(query, limit, offset)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("get_document", {
        title: "Get document",
        description: "Look up an IETF document by name, such as rfc9110 or draft-ietf-httpbis.",
        inputSchema: z.object({ name: z.string().min(1).max(120) }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(format(await getDocument(name)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("search_working_groups", {
        title: "Search working groups",
        description: "Search IETF working groups by name.",
        inputSchema: z.object({ query: z.string().min(1).max(100), limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(format(await searchGroups(query, limit)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("list_recent_meetings", {
        title: "List recent meetings",
        description: "List recent IETF meetings from the public Datatracker.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(format(await listMeetings(limit)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("group_profile", {
        title: "Group profile",
        description: "One IETF working group's profile by acronym: full name, current state, type, parent group, description, mailing list, archive and charter.",
        inputSchema: z.object({ acronym: z.string().min(1).max(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("group_history", {
        title: "Group history",
        description: "Dated history of an IETF working group's state changes, with the change type and any recorded comment.",
        inputSchema: z.object({ acronym: z.string().min(1).max(20), limit: z.number().int().min(1).max(25).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement history locally (paywall removed)
        try {
            return textError("Not yet implemented: history");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("document_authors", {
        title: "Document authors",
        description: "The people credited on an IETF document, with each author's affiliation and country.",
        inputSchema: z.object({ name: z.string().min(1).max(120), limit: z.number().int().min(1).max(60).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await documentAuthors(args));
        }
        catch (e) {
            return errorText(e);
        }
    });
    const serverName = "ietf-mcp";
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
    return server;
}
