import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CourtListenerError, formatDocket, formatOralArg, formatOpinion, formatPerson, searchDockets, searchOpinions, searchOralArgs, searchPeople, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "courtlistener-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_opinions", {
        title: "Search court opinions",
        description: "Search CourtListener opinions: case name, court, filing date, status, citations, judge, syllabus.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'roe wade', ' Miranda rights', 'patent exhaustion'"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchOpinions(query, limit);
            if (results.length === 0)
                return text(`No CourtListener opinions match "${query}".`);
            return text(`CourtListener opinions for "${query}":\n\n${results.map((o, i) => formatOpinion(o, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_dockets", {
        title: "Search federal dockets",
        description: "Search CourtListener RECAP federal dockets: case name, court, docket number, filing date.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. a party name or case topic"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchDockets(query, limit);
            if (results.length === 0)
                return text(`No CourtListener dockets match "${query}".`);
            return text(`CourtListener dockets for "${query}":\n\n${results.map((d, i) => formatDocket(d, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_people", {
        title: "Search judges and attorneys",
        description: "Search CourtListener people: judges, attorneys, parties.",
        inputSchema: z.object({
            query: z.string().describe("Name, e.g. a judge or attorney"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchPeople(query, limit);
            if (results.length === 0)
                return text(`No CourtListener people match "${query}".`);
            return text(`CourtListener people for "${query}":\n\n${results.map((p, i) => formatPerson(p, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_oral_args", {
        title: "Search oral arguments",
        description: "Search CourtListener oral argument audio: case, court, date argued, duration.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. a case name or topic"),
            limit: z.number().int().min(1).max(20).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const results = await searchOralArgs(query, limit);
            if (results.length === 0)
                return text(`No CourtListener oral arguments match "${query}".`);
            return text(`CourtListener oral arguments for "${query}":\n\n${results.map((o, i) => formatOralArg(o, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof CourtListenerError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
