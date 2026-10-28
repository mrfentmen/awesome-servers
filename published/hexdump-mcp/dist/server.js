import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { byteStats, convertBytes, hexDump, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "hexdump-mcp", version: "1.0.0" });
    server.tool("hex_dump", "Hex dump with offsets and an ASCII column, like xxd, from text, hex or base64 input.", {
        data: z.string().describe('Input data'), format: z.enum(['text', 'hex', 'base64']).optional().describe('How to read the input, default text'), width: z.number().int().min(8).max(16).optional().describe('Bytes per row, 8 or 16, default 16'), offset: z.number().int().min(0).optional().describe('Byte offset to start at')
    }, async (a) => {
        try {
            return text(await hexDump(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("convert_bytes", "Convert between text, hex, base64 and decimal byte lists.", {
        data: z.string().describe('Input data'), from: z.enum(['text', 'hex', 'base64']).optional().describe('How to read the input, default text'), to: z.enum(['hex', 'base64', 'text', 'dec']).describe('Output encoding')
    }, async (a) => {
        try {
            return text(await convertBytes(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("byte_stats", "Length, distinct values, printable ratio and entropy of a byte string, plus the first bytes read as numbers.", {
        data: z.string().describe('Input data'), format: z.enum(['text', 'hex', 'base64']).optional().describe('How to read the input, default text')
    }, async (a) => {
        try {
            return text(await byteStats(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
