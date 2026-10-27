import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGoTerm, goAnnotations, goTermChildren, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "quickgo-mcp", version: "1.0.0" });
    server.tool("get_go_term", "Definition, aspect and synonyms for a GO term.", {
        id: z.string().describe('GO ID like "GO:0006915"')
    }, async (a) => {
        try {
            return text(await getGoTerm(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("go_term_children", "Immediate child terms in the GO hierarchy.", {
        id: z.string().describe("GO ID"),
        limit: z.number().int().min(1).max(50).default(15).describe("Children to return")
    }, async (a) => {
        try {
            return text(await goTermChildren(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("go_annotations", "Proteins annotated with a GO term.", {
        id: z.string().describe("GO ID"),
        limit: z.number().int().min(1).max(50).default(10).describe("Annotations to return"),
        taxonId: z.number().int().optional().describe("Optional NCBI taxon filter, e.g. 9606")
    }, async (a) => {
        try {
            return text(await goAnnotations(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
