import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { catBreeds, listFacts, randomCatFact, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "catfact-mcp", version: "1.0.0" });
    server.tool("random_cat_fact", "One random cat fact.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await randomCatFact());
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("cat_breeds", "The cat breed list with country of origin, coat and pattern.", {
        limit: z.number().int().min(1).max(50).optional().describe('Breeds per page, default 10'), page: z.number().int().min(1).max(50).optional().describe('Page number, default 1')
    }, async (a) => {
        try {
            return text(await catBreeds(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("list_facts", "Browse the cat fact database page by page.", {
        limit: z.number().int().min(1).max(50).optional().describe('Facts per page, default 10'), page: z.number().int().min(1).max(50).optional().describe('Page number, default 1')
    }, async (a) => {
        try {
            return text(await listFacts(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
