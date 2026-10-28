import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { geneRecord, searchGenes, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "mygene-mcp", version: "1.0.1" });
    server.tool("search_genes", "Search genes by symbol, name or free text, optionally limited to a species.", {
        query: z.string().min(1).describe('Query, e.g. "symbol:CDK2" or "p53"'),
        species: z.string().optional().describe('Species filter, e.g. "human", "mouse" or "9606"'),
        limit: z.number().int().min(1).max(25).default(10).describe("Genes to return")
    }, async (a) => {
        try {
            return text(await searchGenes(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("gene_record", "One gene record with summary, aliases, genomic position and RefSeq ids.", {
        geneId: z.string().min(1).describe('Entrez gene id or "entrez:672"')
    }, async (a) => {
        try {
            return text(await geneRecord(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
