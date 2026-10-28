import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { agency_totals, agency_detail, award_search, recipient_search, top_recipients, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "usaspending-mcp", version: "1.0.0" });
    server.tool("agency_totals", "Budget, obligations and outlays for every top-tier agency", {
        limit: z.number().int().min(1).max(50).default(15).describe("Maximum agencies")
    }, async (a) => {
        try {
            return text(await agency_totals(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("agency_detail", "One agency's budget totals by toptier code", {
        code: z.string().min(1).describe("Top-tier code, e.g. 012")
    }, async (a) => {
        try {
            return text(await agency_detail(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("award_search", "Search federal awards by keyword", {
        keyword: z.string().min(2).describe("Keyword such as cybersecurity"),
        limit: z.number().int().min(1).max(20).default(5).describe("Maximum awards")
    }, async (a) => {
        try {
            return text(await award_search(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("recipient_search", "Search award recipients by name", {
        keyword: z.string().min(2).describe("Recipient name"),
        limit: z.number().int().min(1).max(20).default(10).describe("Maximum recipients")
    }, async (a) => {
        try {
            return text(await recipient_search(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("top_recipients", "Largest recipients of federal awards", {
        limit: z.number().int().min(1).max(20).default(10).describe("Maximum recipients")
    }, async (a) => {
        try {
            return text(await top_recipients(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
