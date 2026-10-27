import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { phenotypeChildren, phenotypeTerm, searchPhenotypes, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "hpo-mcp", version: "1.0.0" });
    server.tool("search_phenotypes", "Search phenotype terms by name or definition.", {
        query: z.string().min(2).describe('Term text, e.g. "seizure"'),
        limit: z.number().int().min(1).max(25).default(10).describe("Results to return")
    }, async (a) => {
        try {
            return text(await searchPhenotypes(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("phenotype_term", "Read one HPO term with definition, synonyms and parents.", {
        id: z.string().describe('HPO ID like "HP:0001250"')
    }, async (a) => {
        try {
            return text(await phenotypeTerm(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("phenotype_children", "More specific phenotypes below a term.", {
        id: z.string().describe("HPO ID"),
        limit: z.number().int().min(1).max(50).default(12).describe("Children to return")
    }, async (a) => {
        try {
            return text(await phenotypeChildren(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
