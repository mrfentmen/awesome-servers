import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookup, barcodeCheck } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "upcitemdb-mcp", version: "1.0.0" });
    server.registerTool("lookup", {
        title: "Lookup",
        description: "Look up a barcode.",
        inputSchema: z.object({ upc: z.string().describe("UPC/EAN code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("barcode_check", {
        title: "Barcode check",
        description: "Validate and take apart a UPC-A, EAN-13, EAN-8 or UPC-E code: the check digit recomputed against the GS1 rule, the three digit GS1 company prefix, the item reference inside it and the length class. Runs locally, no database lookup.",
        inputSchema: z.object({ upc: z.string().describe("Barcode, or several separated by commas.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await barcodeCheck(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("product_evidence", {
        title: "Product evidence",
        description: "Everything a plain UPCitemdb lookup leaves out: the merchant offers with their prices, conditions and shipping, the cheapest and dearest and the spread between them, the image count, the retailer identifiers and the physical attributes.",
        inputSchema: z.object({ upc: z.string().describe("Barcode, or several separated by commas."), limit: z.number().describe("Merchant listings to print, 1-30.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement evidence locally (paywall removed)
        try {
            return textError("Not yet implemented: evidence");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("compare_barcodes", {
        title: "Compare barcodes",
        description: "Look up to ten barcodes in one UPCitemdb request and set their real merchant offers against each other: cheapest priced offer per code, how many merchant domains carry it, and the gap between the cheapest and priciest of the set.",
        inputSchema: z.object({ upcs: z.string().describe("Two to ten barcodes separated by commas or spaces."), limit: z.number().describe("Merchant listings to print, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement barcodes locally (paywall removed)
        try {
            return textError("Not yet implemented: barcodes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "upcitemdb-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
