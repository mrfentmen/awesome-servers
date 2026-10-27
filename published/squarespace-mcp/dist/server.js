import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatOrder, formatProduct, listOrders, listProducts, SquarespaceError, domainRegistration, pageValidation } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "squarespace-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_products", {
        title: "List products",
        description: "Squarespace store products with prices and links.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listProducts(limit);
            if (rows.length === 0)
                return text("No products.");
            return text(rows.map((p, i) => formatProduct(p, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_orders", {
        title: "List orders",
        description: "Recent Squarespace orders with totals and customer emails.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listOrders(limit);
            if (rows.length === 0)
                return text("No orders.");
            return text(rows.map((o, i) => formatOrder(o, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_registration", {
        title: "Domain registration",
        description: "The registry's own RDAP record for a domain: registrar, registration and expiry dates with the age and runway in words, last-changed date, client and server locks, DNSSEC status, and every nameserver grouped by provider. Needs no Squarespace key.",
        inputSchema: z.object({
            domain: z.string().describe("Domain name, e.g. example.com. A full URL is accepted and trimmed to its host."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await domainRegistration(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_validation", {
        title: "Page validation",
        description: "Runs the W3C Nu HTML validator over a published page and reports the errors and warnings grouped by rule, the first of each with a line number, and the validator version. No Squarespace key needed.",
        inputSchema: z.object({
            url: z.string().describe("Address of the published page to validate, e.g. https://example.com/pricing."),
            limit: z.number().describe("Max messages of each kind listed, 1-40. Defaults to 8.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pageValidation(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "squarespace-mcp";
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
function errorMessage(e) {
    if (e instanceof SquarespaceError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
