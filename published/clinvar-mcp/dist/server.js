import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, queryInfo } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "clinvar-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search ClinVar records.",
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
    server.registerTool("variant_summary", {
        title: "Variant summary",
        description: "Full ClinVar record for one variant: accession and version, object type, germline and somatic classifications with review status, genes, protein change, molecular consequence and supporting SCV and RCV submissions.",
        inputSchema: z.object({ id: z.string().describe("ClinVar id, e.g. VCV000000010 or 10.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement summary locally (paywall removed)
        try {
            return textError("Not yet implemented: summary");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("variant_counts", {
        title: "Variant counts",
        description: "Compare how many ClinVar records match several search terms such as competing genes or conditions, with the proportional bar and the exact query translation NCBI used for each.",
        inputSchema: z.object({ queries: z.string().describe("Terms separated by newlines or semicolons, e.g. BRCA1; BRCA2.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement counts locally (paywall removed)
        try {
            return textError("Not yet implemented: counts");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("query_info", {
        title: "Query info",
        description: "Explain a ClinVar search: total match count, the query translation NCBI built, the translation stack and sets, any warnings, and the first matching ids to feed into variant_summary.",
        inputSchema: z.object({ query: z.string().describe("Search term."), limit: z.number().describe("Max ids to list.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await queryInfo(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "clinvar-mcp";
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
