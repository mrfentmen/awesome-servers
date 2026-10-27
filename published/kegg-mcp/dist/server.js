import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getKeggEntry, pathwaysForEntry, searchCompounds, searchGenes, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "kegg-mcp", version: "1.0.0" });
    server.tool("search_genes", "Find genes by symbol or keyword across KEGG organisms.", {
        query: z.string().min(1).describe('Gene symbol or keyword, e.g. "TP53"'),
        limit: z.number().int().min(1).max(50).default(10).describe("Results to return")
    }, async (a) => {
        try {
            return text(await searchGenes(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("get_kegg_entry", "Read a KEGG entry record such as hsa:7157, C00031 or hsa04115.", {
        entry: z.string().min(1).describe('KEGG identifier, e.g. "hsa:7157", "C00031" or "hsa04115"')
    }, async (a) => {
        try {
            return text(await getKeggEntry(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("pathways_for_entry", "List the KEGG pathways linked to a gene or compound.", {
        entry: z.string().min(1).describe('KEGG identifier, e.g. "hsa:7157"')
    }, async (a) => {
        try {
            return text(await pathwaysForEntry(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("search_compounds", "Find chemical compounds by name or formula fragment.", {
        query: z.string().min(1).describe('Compound name, e.g. "glucose"'),
        limit: z.number().int().min(1).max(50).default(10).describe("Results to return")
    }, async (a) => {
        try {
            return text(await searchCompounds(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
