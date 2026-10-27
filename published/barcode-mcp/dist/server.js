import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateCode128, generateEan, generateQrCode, generateTwoDimensional, validateBarcode } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "barcode-mcp", version: "1.0.0" });
    server.registerTool("generate_ean", {
        title: "Generate ean",
        description: "Generate an EAN-13 barcode as SVG.",
        inputSchema: z.object({ code: z.string().describe("12 or 13 digit EAN code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generateEan(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate_code128", {
        title: "Generate code128",
        description: "Generate a Code-128 barcode as SVG.",
        inputSchema: z.object({ text: z.string().describe("Text to encode.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generateCode128(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate_qr_code", {
        title: "Generate QR code",
        description: "Render a QR code as SVG for any text or URL, with a configurable scale and error correction level from L up to H.",
        inputSchema: z.object({ text: z.string().describe("Text or URL to encode."), scale: z.number().describe("Module scale 1 to 8.").optional(), error_correction: z.string().describe("L, M, Q or H.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generateQrCode(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("generate_2d_barcode", {
        title: "Generate 2D barcode",
        description: "Render a stacked or matrix barcode as SVG in Data Matrix, PDF417, MaxiCode or Aztec format, for labels that carry more data than a QR code.",
        inputSchema: z.object({ text: z.string().describe("Text to encode."), format: z.string().describe("datamatrix, pdf417, maxicode or aztec."), scale: z.number().describe("Module scale.").optional(), rows: z.number().describe("Row count hint for PDF417.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generateTwoDimensional(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    server.registerTool("validate_barcode", {
        title: "Validate barcode",
        description: "Verify the check digit on an EAN-13, EAN-8 or UPC-A code, report whether it is valid and give the corrected full code, so a mistyped digit can be found before printing.",
        inputSchema: z.object({ code: z.string().describe("Barcode digits."), symbology: z.string().describe("Force ean13, ean8 or upca.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await validateBarcode(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "barcode-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    return server;
}
