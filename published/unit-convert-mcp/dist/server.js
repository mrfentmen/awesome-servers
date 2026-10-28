import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convert, listUnits, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "unit-convert-mcp", version: "1.0.0" });
    server.tool("convert", "Convert a value between two units, with aliases like km, ft, lb and mph.", {
        value: z.number().describe('Number to convert'), from: z.string().describe('Source unit, e.g. mile'), to: z.string().describe('Target unit, e.g. kilometre')
    }, async (a) => {
        try {
            return text(await convert(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("list_units", "Every supported category, its base unit and the unit names in it.", {
        category: z.string().optional().describe('Limit to one category, e.g. mass')
    }, async (a) => {
        try {
            return text(await listUnits(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
