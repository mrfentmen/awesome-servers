import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { compoundDescription, compoundProperties, compoundSynonyms, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "pubchem-compound-mcp", version: "1.0.1" });
    server.tool("compound_properties", "Key properties for a compound by name or CID.", {
        name: z.string().min(1).describe('Compound name or CID, e.g. "aspirin" or "2244"')
    }, async (a) => {
        try {
            return text(await compoundProperties(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("compound_synonyms", "Synonyms and trade names listed for a compound.", {
        name: z.string().min(1).describe("Compound name or CID"),
        limit: z.number().int().min(1).max(50).default(20).describe("Synonyms to return")
    }, async (a) => {
        try {
            return text(await compoundSynonyms(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("compound_description", "PubChem's short written description of a compound.", {
        name: z.string().min(1).describe("Compound name or CID")
    }, async (a) => {
        try {
            return text(await compoundDescription(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
