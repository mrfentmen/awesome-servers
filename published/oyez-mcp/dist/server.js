import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatCase, formatHit, getCase, OyezError, searchCases, citation_lookup } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "oyez-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_cases", {
        title: "Search SCOTUS cases",
        description: "Search Oyez for Supreme Court cases by name or topic.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'roe', 'miranda', 'free speech'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchCases(query, limit);
            if (results.length === 0)
                return text(`No Oyez cases match "${query}".`);
            return text(`Oyez cases for "${query}":\n\n${results.map((h, i) => formatHit(h, i)).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_case", {
        title: "Get case details",
        description: "Get a Supreme Court case: parties, question, conclusion, decisions, oral-argument audio.",
        inputSchema: z.object({
            term: z.string().describe("Term year, e.g. '2022' (use search_cases to find it)"),
            docket: z.string().describe("Docket number, e.g. '21-857'"),
        }),
        annotations: READ_ONLY,
    }, async ({ term, docket }) => {
        try {
            return text(formatCase(await getCase(term, docket)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("case_citations", {
        title: "Case citations",
        description: "U.S. Reports citations and decided dates for cases matching a query, sorted most recent first, with the term spread of what the search actually returned.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'miranda' or 'free speech'."),
            limit: z.number().optional().describe("How many search rows to report on, 1 to 100. Defaults to 20."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement citations locally (paywall removed)
        try {
            return textError("Not yet implemented: citations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("case_questions", {
        title: "Case questions and holdings",
        description: "The question presented and Oyez's description for cases matching a query, which the search cases tool does not surface.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'certiorari' or 'fourth amendment'."),
            limit: z.number().optional().describe("How many cases to report, 1 to 50. Defaults to 12."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement questions locally (paywall removed)
        try {
            return textError("Not yet implemented: questions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("citation_lookup", {
        title: "Look up a citation",
        description: "Find the case behind a U.S. Reports citation, given its volume and first page, and fall back to other pages in the same volume when the page does not match.",
        inputSchema: z.object({
            volume: z.string().describe("U.S. Reports volume, e.g. 382."),
            page: z.string().describe("U.S. Reports first page, e.g. 372."),
            limit: z.number().optional().describe("How many search rows to scan, 1 to 100. Defaults to 40."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await citation_lookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("case_timeline", {
        title: "Case timeline",
        description: "Every procedural event Oyez records for matching cases - granted, argued, reargued, decided - and the wait between argument and decision. The citations tool reads the timeline only for the Decided date.",
        inputSchema: z.object({ query: z.string().describe("Search phrase, e.g. 'brown v board' or 'dobbs'."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement timeline locally (paywall removed)
        try {
            return textError("Not yet implemented: timeline");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "oyez-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof OyezError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
