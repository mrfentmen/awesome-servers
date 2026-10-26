import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listProducts, getProduct, listPrices, listFxRates, convertAmount, fxRateHistory } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "paddle-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_products", {
        title: "List products",
        description: "Paddle products with price and status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listProducts());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_product", {
        title: "Get product",
        description: "One Paddle product by id, with price and status.",
        inputSchema: z.object({
            product_id: z.string().describe("Product ID (pro_...).")
        }),
        annotations: READ_ONLY,
    }, async ({ product_id }) => {
        try {
            return text(await getProduct(product_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_prices", {
        title: "List prices",
        description: "Prices, optionally for one product.",
        inputSchema: z.object({
            product_id: z.string().describe("Filter by product ID.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ product_id }) => {
        try {
            return text(await listPrices(product_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_fx_rates", {
        title: "List daily reference rates",
        description: "The full daily reference exchange-rate board for one base currency (European Central Bank rates, 30 currencies).",
        inputSchema: z.object({
            base: z.string().describe("3-letter ISO 4217 code to quote everything against, e.g. 'EUR' or 'USD'.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listFxRates(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("convert_amount", {
        title: "Convert an amount",
        description: "Convert a price or balance between two currencies at the latest European Central Bank reference rate.",
        inputSchema: z.object({
            amount: z.number().describe("Amount in the source currency."),
            from: z.string().describe("3-letter ISO 4217 source code, e.g. 'USD'."),
            to: z.string().describe("3-letter ISO 4217 target code, e.g. 'EUR'."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await convertAmount(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fx_rate_history", {
        title: "Exchange-rate history",
        description: "How a currency pair has moved over a window of days: the first and last published rate, the change, and the high, low and mean across the window.",
        inputSchema: z.object({
            from: z.string().describe("3-letter ISO 4217 base code, e.g. 'USD'."),
            to: z.string().describe("3-letter ISO 4217 quote code, e.g. 'JPY'."),
            days: z.number().describe("Window length in days, 2-3650. Defaults to 30.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fxRateHistory(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "paddle-mcp";
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
    return server;
}
