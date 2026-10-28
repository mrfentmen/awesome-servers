import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { geneSequence, geneXrefs, lookupGene, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ensembl-mcp", version: "1.0.0" });
    server.tool("lookup_gene", "Resolve a gene symbol to its Ensembl gene, with position and biotype.", {
        symbol: z.string().min(1).describe('Gene symbol, e.g. "BRCA2"'),
        species: z.string().default("homo_sapiens").describe('Species in Ensembl snake_case, e.g. "mus_musculus"')
    }, async (a) => {
        try {
            return text(await lookupGene(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("gene_sequence", "The genomic sequence of an Ensembl gene, as FASTA-ish text.", {
        geneId: z.string().regex(/^ENS[A-Z]*G\d+$|^\d+$/).describe('Ensembl gene id or NCBI gene id, e.g. "ENSG00000139618"')
    }, async (a) => {
        try {
            return text(await geneSequence(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("gene_xrefs", "Cross-references for a gene: RefSeq, UniProt, GO and others.", {
        geneId: z.string().describe("Ensembl gene id"),
        limit: z.number().int().min(1).max(50).default(15).describe("Xrefs to return")
    }, async (a) => {
        try {
            return text(await geneXrefs(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
