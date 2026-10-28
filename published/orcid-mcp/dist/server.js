import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getResearcher, listWorks, searchResearchers, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "orcid-mcp", version: "1.0.0" });
    server.tool("search_researchers", "Find researchers by name, keyword or institution.", {
        query: z.string().min(2).describe('Search terms, e.g. "family-name:Curie" or "machine learning"'),
        limit: z.number().int().min(1).max(25).default(8).describe("Results to return")
    }, async (a) => {
        try {
            return text(await searchResearchers(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("get_researcher", "Read a researcher profile and their current affiliations.", {
        orcid: z.string().describe('ORCID iD like "0000-0002-1825-0097"')
    }, async (a) => {
        try {
            return text(await getResearcher(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("list_works", "List works on an ORCID record with title, year, type and DOI.", {
        orcid: z.string().describe("ORCID iD"),
        limit: z.number().int().min(1).max(50).default(10).describe("Works to return")
    }, async (a) => {
        try {
            return text(await listWorks(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
