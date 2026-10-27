import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { rates, rateConvert } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "cbr-mcp", version: "1.0.0" });
    server.registerTool("rates", {
        title: "Rates",
        description: "Daily exchange rates.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await rates(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rate_history", {
        title: "Rate history",
        description: "One currency against the rouble over a date range, from the official CBR rate history: every published day, plus low, high and percent change.",
        inputSchema: z.object({ currency: z.string().describe("Currency code like USD or EUR."), from: z.string().describe("Start date, YYYY-MM-DD. Defaults to 90 days before to.").optional(), to: z.string().describe("End date, YYYY-MM-DD. Defaults to today.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement history locally (paywall removed)
        try {
            return textError("Not yet implemented: history");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rate_movers", {
        title: "Rate movers",
        description: "Which currencies moved most against the rouble between the last two published days, ranked both ways.",
        inputSchema: z.object({ limit: z.number().describe("How many currencies to show on each side, 1-20. Defaults to 6.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement movers locally (paywall removed)
        try {
            return textError("Not yet implemented: movers");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rate_convert", {
        title: "Rate convert",
        description: "Convert an amount between any two currencies CBR publishes, on a chosen date, using the official per unit rates.",
        inputSchema: z.object({ amount: z.number().describe("How much to convert. Defaults to 1.").optional(), from: z.string().describe("Currency to convert from, like USD. Defaults to USD.").optional(), to: z.string().describe("Currency to convert to, like RUB. Defaults to RUB.").optional(), date: z.string().describe("Date to use, YYYY-MM-DD. Defaults to the latest published set.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await rateConvert(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "cbr-mcp";
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
