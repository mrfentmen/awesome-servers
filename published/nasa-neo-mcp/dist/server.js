import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { closeApproaches, objectDetail, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "nasa-neo-mcp", version: "1.0.1" });
    server.tool("close_approaches", "Asteroids approaching Earth between two dates, nearest first.", {
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date YYYY-MM-DD"),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date YYYY-MM-DD, at most 7 days after start"),
        limit: z.number().int().min(1).max(40).default(15).describe("Objects to return")
    }, async (a) => {
        try {
            return text(await closeApproaches(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("object_detail", "One asteroid by its NASA id: orbit class, size range and all close approaches.", {
        asteroidId: z.string().min(3).describe('NASA object id, e.g. "3542519"')
    }, async (a) => {
        try {
            return text(await objectDetail(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
