import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checksumAll, crc16, crc32, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "crc-mcp", version: "1.0.0" });
    server.tool("crc32", "CRC-32 in four flavours plus Adler-32, as hex, decimal and bytes.", {
        data: z.string().describe('Input data'), format: z.enum(['text', 'hex', 'base64']).optional().describe('How to read the input, default text'), variant: z.enum(['crc32', 'crc32c', 'crc32/bzip2', 'crc32/mpeg2', 'adler32']).optional().describe('Which checksum, default crc32')
    }, async (a) => {
        try {
            return text(await crc32(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("crc16", "CRC-16 in five common flavours (ARC, CCITT-FALSE, XMODEM, MODBUS, X-25).", {
        data: z.string().describe('Input data'), format: z.enum(['text', 'hex', 'base64']).optional().describe('How to read the input, default text'), variant: z.enum(['crc16/arc', 'crc16/ccitt-false', 'crc16/xmodem', 'crc16/modbus', 'crc16/x25']).optional().describe('Which checksum, default crc16/arc')
    }, async (a) => {
        try {
            return text(await crc16(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("checksum_all", "Every supported checksum plus MD5, SHA-1 and SHA-256 in one call.", {
        data: z.string().describe('Input data'), format: z.enum(['text', 'hex', 'base64']).optional().describe('How to read the input, default text')
    }, async (a) => {
        try {
            return text(await checksumAll(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
