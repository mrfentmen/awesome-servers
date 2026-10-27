import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { newestPapers, paperInfo, papersById, searchAuthor, searchCategory, searchTitle } from "./api.js";
import { searchPapers } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "arxiv-mcp", version: "1.0.0" });
    server.registerTool("search_papers", {
        title: "Search papers",
        description: "Search arXiv papers.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchPapers(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("paper_info", {
        title: "Paper info",
        description: "Get details for a paper by arXiv ID.",
        inputSchema: z.object({ paperId: z.string().describe("arXiv paper ID like 2301.00001.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await paperInfo(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_title", {
        title: "Search titles",
        description: "Search arXiv paper titles only.",
        inputSchema: z.object({ query: z.string().describe("Title terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchTitle(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_author", {
        title: "Search author",
        description: "Papers by an author name.",
        inputSchema: z.object({ query: z.string().describe("Author name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchAuthor(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_category", {
        title: "Search category",
        description: "Papers in an arXiv category like cs.LG.",
        inputSchema: z.object({ category: z.string().describe("Category like cs.LG."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchCategory(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("newest_papers", {
        title: "Newest papers",
        description: "Newest submissions first.",
        inputSchema: z.object({ query: z.string().describe("Search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await newestPapers(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("papers_by_id", {
        title: "Papers by ID",
        description: "Look up up to 10 papers by ID list.",
        inputSchema: z.object({ ids: z.string().describe("Comma-separated arXiv IDs.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await papersById(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
