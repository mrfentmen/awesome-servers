import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { base58AlphabetInfo, base58Decode, base58Encode, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "base58-mcp", version: "1.0.0" });
    server.tool("base58_encode", "Encode bytes as base58 or base58check, optionally with a version byte.", {
        data: z.string().describe('Input bytes as text, hex or base64'), format: z.enum(['text', 'hex', 'base64']).optional().describe('How to read the input, default text'), check: z.boolean().optional().describe('Add the double-SHA256 checksum (base58check)'), version: z.string().optional().describe('One version byte in hex, e.g. 00 or 80 (with check)')
    }, async (a) => {
        try {
            return text(await base58Encode(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("base58_decode", "Decode base58 text to hex, base64 and text, verifying the checksum when asked.", {
        text: z.string().describe('Base58 string'), check: z.boolean().optional().describe('Verify the 4-byte base58check checksum')
    }, async (a) => {
        try {
            return text(await base58Decode(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("base58_alphabet_info", "The base58 alphabet and the common version bytes used with base58check.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await base58AlphabetInfo());
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
