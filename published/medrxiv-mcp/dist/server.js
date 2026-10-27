import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { details, recent, revisedPreprints } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "medrxiv-mcp", version: "1.0.0" });
    server.registerTool("details", {
        title: "Details",
        description: "Get preprint details.",
        inputSchema: z.object({ doi: z.string().describe("medRxiv DOI.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await details(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent", {
        title: "Recent",
        description: "Recent preprints.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recent(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("preprints_by_date", {
        title: "Preprints by date",
        description: "medRxiv preprints posted inside a date window, with posted date, version, subject category and DOI.",
        inputSchema: z.object({ start: z.string().describe("Window start, YYYY-MM-DD."), end: z.string().describe("Window end, YYYY-MM-DD."), limit: z.number().describe("Max preprints to list.").optional(), pages: z.number().describe("How many 30-record pages to walk, 1-4.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement date locally (paywall removed)
        try {
            return textError("Not yet implemented: date");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("category_breakdown", {
        title: "Category breakdown",
        description: "What a medRxiv date window is made of: subject categories, version mix, licences and most frequent first authors, with the window total.",
        inputSchema: z.object({ start: z.string().describe("Window start, YYYY-MM-DD."), end: z.string().describe("Window end, YYYY-MM-DD."), pages: z.number().describe("How many 30-record pages to walk, 1-4.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement breakdown locally (paywall removed)
        try {
            return textError("Not yet implemented: breakdown");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("revised_preprints", {
        title: "Revised preprints",
        description: "medRxiv preprints in a date window that are revisions (version 2 or later) rather than first postings, with authors and DOI.",
        inputSchema: z.object({ start: z.string().describe("Window start, YYYY-MM-DD."), end: z.string().describe("Window end, YYYY-MM-DD."), limit: z.number().describe("Max revisions to list.").optional(), pages: z.number().describe("How many 30-record pages to walk, 1-4.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await revisedPreprints(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "medrxiv-mcp";
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
