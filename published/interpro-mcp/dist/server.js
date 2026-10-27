import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { entry, search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "interpro-mcp", version: "1.0.0" });
    server.registerTool("entry", {
        title: "Entry",
        description: "Get an InterPro entry.",
        inputSchema: z.object({ id: z.string().describe("Entry accession like IPR000001.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await entry(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search", {
        title: "Search",
        description: "Search entries.",
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
    server.registerTool("protein_entry_matches", {
        title: "Protein entry matches",
        description: "Which InterPro entries match one UniProt accession: entry name and type, integration date, member databases and matched protein records.",
        inputSchema: z.object({ accession: z.string().describe("UniProt accession, e.g. 'P04637'."), limit: z.number().int().min(1).max(50).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement matches locally (paywall removed)
        try {
            return textError("Not yet implemented: matches");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("entry_protein_matches", {
        title: "Entry protein matches",
        description: "Which UniProt proteins contain one InterPro entry: accession, name, source organism, length, AlphaFold presence and the matching entry type.",
        inputSchema: z.object({ accession: z.string().describe("InterPro accession, e.g. 'IPR000001'."), limit: z.number().int().min(1).max(30).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement matches locally (paywall removed)
        try {
            return textError("Not yet implemented: matches");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "interpro-mcp";
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
