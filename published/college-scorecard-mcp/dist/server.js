import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { byCity, byOwnership, byState, schoolDetails, search, topEarnings } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "college-scorecard-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search colleges by name.",
        inputSchema: z.object({ query: z.string().describe("College name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("by_state", {
        title: "By state",
        description: "Colleges in a state.",
        inputSchema: z.object({ state: z.string().describe("2-letter code like CA."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await byState(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("by_city", {
        title: "By city",
        description: "Colleges in a city.",
        inputSchema: z.object({ city: z.string().describe("City name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await byCity(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("school_details", {
        title: "School details",
        description: "Admissions, cost and earnings for one school.",
        inputSchema: z.object({ id: z.string().describe("School id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await schoolDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("by_ownership", {
        title: "By ownership",
        description: "1 public, 2 private nonprofit, 3 for-profit.",
        inputSchema: z.object({ ownership: z.string().describe("1, 2 or 3."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await byOwnership(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("top_earnings", {
        title: "Top earnings",
        description: "Schools by graduate earnings.",
        inputSchema: z.object({ state: z.string().describe("2-letter code.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await topEarnings(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
