import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookup, sequence, genesInRegion } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ensembl-mcp", version: "1.0.0" });
    server.registerTool("lookup", {
        title: "Lookup",
        description: "Look up a gene symbol.",
        inputSchema: z.object({ species: z.string().describe("Species, e.g. human.").optional(), symbol: z.string().describe("Gene symbol.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sequence", {
        title: "Sequence",
        description: "Get sequence for a stable id.",
        inputSchema: z.object({ id: z.string().describe("Stable transcript id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sequence(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("gene_transcripts", {
        title: "Gene transcripts",
        description: "Every Ensembl transcript of a gene, with biotype, length and which one is canonical.",
        inputSchema: z.object({ id: z.string().describe("Gene stable id, e.g. ENSG00000012048."), limit: z.number().describe("Max transcripts.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement transcripts locally (paywall removed)
        try {
            return textError("Not yet implemented: transcripts");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("gene_exons", {
        title: "Gene exon structure",
        description: "Exon coordinates and intronic versus exonic base counts for a gene or one transcript.",
        inputSchema: z.object({ id: z.string().describe("Gene or transcript stable id."), transcript: z.string().describe("Only exons of this transcript id.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement exons locally (paywall removed)
        try {
            return textError("Not yet implemented: exons");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("genes_in_region", {
        title: "Genes in region",
        description: "Ensembl features inside a genomic interval, by chromosome and coordinates.",
        inputSchema: z.object({ species: z.string().describe("Species, e.g. human.").optional(), chrom: z.string().describe("Chromosome, e.g. 7."), start: z.number().describe("Start coordinate."), end: z.number().describe("End coordinate."), feature: z.string().describe("Feature type, e.g. gene or transcript.").optional(), limit: z.number().describe("Max features.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await genesInRegion(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ensembl-mcp";
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
