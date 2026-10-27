import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTaxon, searchTaxonomy, taxonomyLineage, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ncbi-taxonomy-mcp", version: "1.0.0" });
    server.tool("search_taxonomy", "Find taxa by scientific or common name.", {
        query: z.string().min(2).describe('Name, e.g. "Homo sapiens" or "wolves"'),
        limit: z.number().int().min(1).max(20).default(8).describe("Results to return")
    }, async (a) => {
        try {
            return text(await searchTaxonomy(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("get_taxon", "Read one taxon record by NCBI taxon ID.", {
        taxid: z.number().int().positive().describe("NCBI taxon ID, e.g. 9606")
    }, async (a) => {
        try {
            return text(await getTaxon(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("taxonomy_lineage", "Full taxonomic lineage for a taxon ID.", {
        taxid: z.number().int().positive().describe("NCBI taxon ID")
    }, async (a) => {
        try {
            return text(await taxonomyLineage(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
