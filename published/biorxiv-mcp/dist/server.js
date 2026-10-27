import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { details, recent, preprintVersions } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "biorxiv-mcp", version: "1.0.0" });
    server.registerTool("details", {
        title: "Details",
        description: "Get preprint details.",
        inputSchema: z.object({ doi: z.string().describe("bioRxiv DOI.") }),
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
        description: "List bioRxiv or medRxiv preprints posted within a date interval with title, authors, category, version and whether the preprint has since been published in a journal.",
        inputSchema: z.object({ from: z.string().describe("Start date, YYYY-MM-DD."), to: z.string().describe("End date, YYYY-MM-DD."), category: z.string().describe("biorxiv or medrxiv.").optional(), limit: z.number().describe("Max preprints.").optional(), cursor: z.number().describe("Pagination cursor.").optional() }),
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
    server.registerTool("publication_linkage", {
        title: "Publication linkage",
        description: "Measure how many preprints posted in an interval went on to journal publication, with the top journals, the median days from preprint to publication and example preprint to journal DOI pairs.",
        inputSchema: z.object({ from: z.string().describe("Start date, YYYY-MM-DD."), to: z.string().describe("End date, YYYY-MM-DD."), limit: z.number().describe("Max linked pairs listed.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement linkage locally (paywall removed)
        try {
            return textError("Not yet implemented: linkage");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("preprint_versions", {
        title: "Preprint versions",
        description: "Every posted version of a bioRxiv preprint with its version number, posting date, category and publication status, plus the full author list, corresponding author and abstract.",
        inputSchema: z.object({ doi: z.string().describe("bioRxiv DOI, e.g. 10.1101/718403.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await preprintVersions(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "biorxiv-mcp";
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
