import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { candidateSummary, formatCandidate, OpenSecretsError, searchCandidates, fecCandidateSearch, fecCommitteeSearch } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "opensecrets-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_candidates", {
        title: "Search candidates",
        description: "Find federal candidates by name fragment: party, state, chamber, CRP id.",
        inputSchema: z.object({
            query: z.string().describe("Name fragment, e.g. 'Smith'"),
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            const rows = await searchCandidates(query);
            if (rows.length === 0)
                return text(`No candidates match "${query}".`);
            return text(rows.map((c, i) => formatCandidate(c, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("candidate_summary", {
        title: "Money summary",
        description: "Raised, spent, cash on hand and debt for one candidate and cycle.",
        inputSchema: z.object({
            cid: z.string().describe("CRP candidate id, e.g. 'N00007360' (use search_candidates)"),
            cycle: z.string().default("2024").describe("Election cycle, e.g. '2024'"),
        }),
        annotations: READ_ONLY,
    }, async ({ cid, cycle }) => {
        try {
            return text(await candidateSummary(cid, cycle));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fec_candidate_search", {
        title: "Search the FEC candidate index",
        description: "Federal campaign-finance candidate index by name fragment, with office, state and party filters, plus each candidate's principal committees and cycle history.",
        inputSchema: z.object({
            query: z.string().describe("Name fragment, e.g. 'Sanders'"),
            office: z.string().default("").describe("Office code: H for House, S for Senate, P for President, empty = all"),
            state: z.string().default("").describe("Two-letter state or 'US', empty = all"),
            party: z.string().default("").describe("DEM, REP, IND or empty = all"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, office, state, party, limit }) => {
        try {
            return text(await fecCandidateSearch({ query, office, state, party, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fec_committee_search", {
        title: "Search the FEC committee index",
        description: "Federal campaign committees by name keyword: type, designation, party, treasurer, filing frequency, cycle span and sponsored candidates.",
        inputSchema: z.object({
            query: z.string().describe("Committee name fragment, e.g. 'for Senate'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await fecCommitteeSearch({ query, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "opensecrets-mcp";
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
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof OpenSecretsError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
