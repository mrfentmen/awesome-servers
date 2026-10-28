import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listOntologies, ontologyTerm, searchOntologyTerms, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ols-mcp", version: "1.0.0" });
    server.tool("search_ontology_terms", "Search terms across all ontologies, optionally limited to one.", {
        query: z.string().min(2).describe('Term text, e.g. "apoptosis"'),
        limit: z.number().int().min(1).max(25).default(10).describe("Results to return"),
        ontology: z.string().optional().describe('Optional ontology id like "go" or "efo"')
    }, async (a) => {
        try {
            return text(await searchOntologyTerms(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("list_ontologies", "List loaded ontologies with their term counts.", {
        query: z.string().optional().describe("Optional filter by name"),
        limit: z.number().int().min(1).max(50).default(15).describe("Ontologies to return")
    }, async (a) => {
        try {
            return text(await listOntologies(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("ontology_term", "Read a term from one ontology by its IRI.", {
        ontology: z.string().describe('Ontology id, e.g. "go"'),
        iri: z.string().url().describe("Full term IRI")
    }, async (a) => {
        try {
            return text(await ontologyTerm(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
