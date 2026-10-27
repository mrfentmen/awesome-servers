import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchVolcanoes, volcanoDetail, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "volcano-mcp", version: "1.0.1" });
    server.tool("search_volcanoes", "Search Holocene volcanoes by name, country or region.", {
        query: z.string().min(2).describe('Text to match, e.g. "Etna", "Iceland" or "Japan"'),
        limit: z.number().int().min(1).max(25).default(10).describe("Volcanoes to return")
    }, async (a) => {
        try {
            return text(await searchVolcanoes(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("volcano_detail", "One volcano: last eruption, elevation, setting, rock type and the GVP summary.", {
        name: z.string().min(3).describe('Volcano name, e.g. "Eyjafjallajokull"')
    }, async (a) => {
        try {
            return text(await volcanoDetail(a));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
