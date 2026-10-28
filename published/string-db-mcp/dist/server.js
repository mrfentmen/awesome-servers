import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { interactionPartners, mapIdentifiers, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "string-db-mcp", version: "1.0.1" });
    server.tool("map_identifiers", "Map gene names to STRING ids for a species.", {
        identifiers: z.string().min(2).describe('Comma-separated names, e.g. "TP53,BRCA1"'),
        species: z.number().int().positive().default(9606).describe("NCBI taxon id, default 9606 human")
    }, async (a) => {
        try {
            return text(await mapIdentifiers(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("interaction_partners", "Top interaction partners of a protein, with combined scores.", {
        identifier: z.string().min(2).describe('Gene name, e.g. "TP53"'),
        species: z.number().int().positive().default(9606).describe("NCBI taxon id"),
        limit: z.number().int().min(1).max(50).default(15).describe("Partners to return")
    }, async (a) => {
        try {
            return text(await interactionPartners(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
