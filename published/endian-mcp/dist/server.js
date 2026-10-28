import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { intInfo, interpretBytes, swapEndian, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "endian-mcp", version: "1.0.0" });
    server.tool("swap_endian", "Reverse the bytes of a 16, 32 or 64-bit integer and show the result as hex and decimal, signed and unsigned.", {
        value: z.string().describe('Integer in decimal or 0x hex'), bits: z.number().int().min(16).max(64).describe('Word size: 16, 32 or 64')
    }, async (a) => {
        try {
            return text(await swapEndian(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("interpret_bytes", "Read raw bytes as u8/i16/u32/i32/f32/u64/f64 in both endiannesses, from a given offset.", {
        data: z.string().describe('Byte string'), format: z.enum(['hex', 'base64', 'text']).optional().describe('How to read the input, default hex'), offset: z.number().int().min(0).optional().describe('Byte offset')
    }, async (a) => {
        try {
            return text(await interpretBytes(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("int_info", "Show an integer as unsigned, signed (two's complement), hex, binary and both byte orders, with the ranges it fits.", {
        value: z.string().describe('Integer in decimal or 0x hex, negative allowed'), bits: z.number().int().min(8).max(64).optional().describe('Width, 8, 16, 32 or 64, default 32')
    }, async (a) => {
        try {
            return text(await intInfo(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
