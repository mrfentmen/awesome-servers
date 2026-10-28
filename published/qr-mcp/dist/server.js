import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { qrAscii, qrMatrix, qrSvg, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "qr-mcp", version: "1.0.0" });
    server.tool("qr_matrix", "The QR module matrix as rows of 0 and 1, with the best mask chosen by the standard penalty rules.", {
        text: z.string().describe('Text to encode, up to 230 bytes'), ecl: z.enum(['L', 'M', 'Q', 'H']).optional().describe('Error correction level, default M'), version: z.number().int().min(1).max(9).optional().describe('Force a version 1-9 instead of the smallest that fits'), mask: z.number().int().min(0).max(7).optional().describe('Force a mask pattern instead of the best one')
    }, async (a) => {
        try {
            return text(await qrMatrix(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("qr_ascii", "Render the QR code as big ASCII blocks with the standard quiet zone, for terminals and chat.", {
        text: z.string().describe('Text to encode, up to 230 bytes'), ecl: z.enum(['L', 'M', 'Q', 'H']).optional().describe('Error correction level, default M'), version: z.number().int().min(1).max(9).optional().describe('Force a version'), invert: z.boolean().optional().describe('Swap dark and light (dark terminals)')
    }, async (a) => {
        try {
            return text(await qrAscii(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("qr_svg", "A printable SVG QR code with an exact-sized viewBox and integer module scaling.", {
        text: z.string().describe('Text to encode, up to 230 bytes'), ecl: z.enum(['L', 'M', 'Q', 'H']).optional().describe('Error correction level, default M'), version: z.number().int().min(1).max(9).optional().describe('Force a version'), scale: z.number().int().min(1).max(64).optional().describe('Pixels per module, default 8'), margin: z.number().int().min(0).max(16).optional().describe('Quiet zone in modules, default 4')
    }, async (a) => {
        try {
            return text(await qrSvg(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
