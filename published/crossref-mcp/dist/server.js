import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CrossrefError, funderSearch, journalInfo, recentWorks, searchWorks, workByDoi, worksByAuthor, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof CrossrefError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "crossref-mcp", version: "1.0.0" });
    server.tool("search_works", "Search 160M+ scholarly works by title, topic or citation text.", {
        query: z.string().min(3).describe('What to search for, e.g. "graph neural networks for molecules"'),
        rows: z.number().int().min(1).max(25).default(8).describe("How many works to return"),
    }, async ({ query, rows }) => {
        try {
            return text(await searchWorks(query, rows));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("work_by_doi", "Full metadata for one paper by its DOI: authors, venue, citations, references, license.", { doi: z.string().min(6).describe("DOI, e.g. 10.1038/nature12373") }, async ({ doi }) => {
        try {
            return text(await workByDoi(doi));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("journal_info", "Journal record by ISSN: publisher, ISSNs, how many works Crossref indexes.", { issn: z.string().min(8).describe("ISSN, e.g. 0028-0836") }, async ({ issn }) => {
        try {
            return text(await journalInfo(issn));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("recent_works", "Journal articles published in the last N days, optionally filtered by topic.", {
        query: z.string().optional().describe("Optional topic filter"),
        days: z.number().int().min(1).max(365).default(7).describe("Look back this many days"),
        rows: z.number().int().min(1).max(25).default(8).describe("How many works to return"),
    }, async ({ query, days, rows }) => {
        try {
            return text(await recentWorks(query, days, rows));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("works_by_author", "Most-cited works Crossref attributes to an author name.", {
        author: z.string().min(3).describe('Author name, e.g. "Yann LeCun"'),
        rows: z.number().int().min(1).max(25).default(8).describe("How many works to return"),
    }, async ({ author, rows }) => {
        try {
            return text(await worksByAuthor(author, rows));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("funder_search", "Find research funders registered with Crossref by name.", {
        query: z.string().min(2).describe('Funder name, e.g. "gates" or "european commission"'),
        rows: z.number().int().min(1).max(25).default(8).describe("How many funders to return"),
    }, async ({ query, rows }) => {
        try {
            return text(await funderSearch(query, rows));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
