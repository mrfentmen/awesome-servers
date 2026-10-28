import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search_by_name, lei_record, ultimate_parent, direct_children, fuzzy_search, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "gleif-mcp", version: "1.0.0" });
    server.tool("search_by_name", "Search legal entities by name and return their LEIs", {
        name: z.string().min(2).describe("Legal entity name, e.g. Apple"),
        limit: z.number().int().min(1).max(20).default(5).describe("Maximum entities")
    }, async (a) => {
        try {
            return text(await search_by_name(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("lei_record", "Full LEI record: legal name, address and registration status", {
        lei: z.string().length(20).describe("20-character LEI")
    }, async (a) => {
        try {
            return text(await lei_record(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("ultimate_parent", "Ultimate parent company of an LEI", {
        lei: z.string().length(20).describe("20-character LEI")
    }, async (a) => {
        try {
            return text(await ultimate_parent(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("direct_children", "Direct children of an LEI", {
        lei: z.string().length(20).describe("20-character LEI"),
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum children")
    }, async (a) => {
        try {
            return text(await direct_children(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("fuzzy_search", "Fuzzy legal-name completion to find near matches", {
        name: z.string().min(2).describe("Partial or misspelled name")
    }, async (a) => {
        try {
            return text(await fuzzy_search(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
