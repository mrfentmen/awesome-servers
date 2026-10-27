import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { abstract, article, citedBy, dbInfo, medline, meshSearch, spellcheck } from "./api.js";
import { search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "pubmed-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search PubMed for articles matching a query.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("article", {
        title: "Article",
        description: "Fetch the summary for one PubMed article.",
        inputSchema: z.object({ pmid: z.string().describe("PubMed ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await article(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("abstract", {
        title: "Abstract",
        description: "Full abstract text for one PMID.",
        inputSchema: z.object({ pmid: z.string().describe("PubMed ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await abstract(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("medline", {
        title: "MEDLINE",
        description: "Full MEDLINE record for one PMID.",
        inputSchema: z.object({ pmid: z.string().describe("PubMed ID.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await medline(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("cited_by", {
        title: "Cited by",
        description: "Articles citing one PMID.",
        inputSchema: z.object({ pmid: z.string().describe("PubMed ID."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await citedBy(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("spellcheck", {
        title: "Spellcheck",
        description: "Spelling suggestions for a term.",
        inputSchema: z.object({ term: z.string().describe("Term.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await spellcheck(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("db_info", {
        title: "DB info",
        description: "Info for an NCBI database.",
        inputSchema: z.object({ db: z.string().describe("Database like pubmed.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dbInfo(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("mesh_search", {
        title: "MeSH search",
        description: "Search medical subject headings.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await meshSearch(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
