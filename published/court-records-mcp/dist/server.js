import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCase, listCourts, searchCases, searchDockets, searchJudges } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "court-records-mcp", version: "1.0.0" });
    server.registerTool("search_cases", {
        title: "Search cases",
        description: "Search published court opinions by keyword.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), page_size: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchCases(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("get_case", {
        title: "Get case",
        description: "Get a single court opinion by CourtListener opinion id.",
        inputSchema: z.object({ case_id: z.number().describe("CourtListener opinion id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await getCase(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_dockets", {
        title: "Search dockets",
        description: "Search dockets and RECAP filings by keyword.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), page_size: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchDockets(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("list_courts", {
        title: "List courts",
        description: "Courts in the CourtListener directory.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listCourts(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_judges", {
        title: "Search judges",
        description: "Find judges by first name.",
        inputSchema: z.object({ query: z.string().describe("Judge first name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchJudges(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
