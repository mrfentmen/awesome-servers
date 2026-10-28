import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { geneRecord, geneXrefs, searchGenes, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "hgnc-mcp", version: "1.0.0" });
    server.tool("search_genes", "Search HGNC genes by symbol, alias, previous symbol, name or a stable identifier such as an Ensembl or Entrez id.", {
        query: z.string().min(1).describe("What to search for, e.g. BRCA1 or a tumour suppressor alias"),
        field: z.enum(["symbol", "alias_symbol", "prev_symbol", "name", "entrez_id", "ensembl_gene_id", "uniprot_ids"]).default("symbol").describe("Which HGNC field to search"),
        limit: z.number().int().min(1).max(50).default(10).describe("Rows to return")
    }, async (a) => {
        try {
            return text(await searchGenes(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("gene_record", "The full approved HGNC record for one gene symbol: name, location, aliases, cross-references and dates.", {
        symbol: z.string().min(1).describe("Approved gene symbol, e.g. TP53")
    }, async (a) => {
        try {
            return text(await geneRecord(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("gene_xrefs", "Every cross-reference HGNC holds for a gene: Ensembl, Entrez, UniProt, RefSeq, CCDS, OMIM and more.", {
        symbol: z.string().min(1).describe("Approved gene symbol, e.g. BRCA2")
    }, async (a) => {
        try {
            return text(await geneXrefs(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
