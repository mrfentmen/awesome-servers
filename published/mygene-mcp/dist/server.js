import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get, query } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "mygene-mcp", version: "1.0.0" });
    server.registerTool("query", {
        title: "Query",
        description: "Query genes.",
        inputSchema: z.object({ q: z.string().describe("Gene name, symbol, or keyword."), size: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await query(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get", {
        title: "Get",
        description: "Get a gene by id.",
        inputSchema: z.object({ id: z.string().describe("Gene id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await get(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("gene_pathways", {
        title: "Gene pathways",
        description: "The pathway annotations MyGene holds for a gene: which Biocarta, KEGG, Reactome, WikiPathways and other pathway collections it belongs to.",
        inputSchema: z.object({ symbol: z.string().describe("Gene symbol, e.g. TP53."), species: z.string().describe("Species name, e.g. human.").optional(), limit: z.number().int().min(1).max(30).default(10).describe("Max entries per source.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement pathways locally (paywall removed)
        try {
            return textError("Not yet implemented: pathways");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("gene_location", {
        title: "Gene location",
        description: "Where a gene sits on the genome: cytoband, chromosome, start and end coordinates, strand, plus its Ensembl and Entrez ids.",
        inputSchema: z.object({ id: z.string().describe("MyGene id such as 7157, or a symbol such as TP53.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement location locally (paywall removed)
        try {
            return textError("Not yet implemented: location");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mygene-mcp";
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
