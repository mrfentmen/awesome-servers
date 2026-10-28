import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { geneDatasets, genomeDatasets, taxonomyLookup, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ncbi-datasets-mcp", version: "1.0.0" });
    server.tool("genome_datasets", "Genome assembly reports for a taxon: accession, assembly name and level, sizes and dates.", {
        taxon: z.string().min(1).describe("Taxon name or id, e.g. human, mouse, 9606"),
        limit: z.number().int().min(1).max(25).default(5).describe("Assemblies to return")
    }, async (a) => {
        try {
            return text(await genomeDatasets(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("gene_datasets", "NCBI gene records for a symbol in a taxon: gene id, description, transcript and product counts.", {
        symbol: z.string().min(1).describe("Gene symbol, e.g. BRCA1"),
        taxon: z.string().min(1).default("human").describe("Taxon name or id, e.g. human"),
        limit: z.number().int().min(1).max(25).default(5).describe("Records to return")
    }, async (a) => {
        try {
            return text(await geneDatasets(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("taxonomy", "Resolve a taxon name or id to its NCBI taxonomy record: tax id, organism name, rank and lineage ids.", {
        taxon: z.string().min(1).describe("Taxon name or id, e.g. human or 9606")
    }, async (a) => {
        try {
            return text(await taxonomyLookup(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
