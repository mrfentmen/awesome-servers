import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { laureates, prizes } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "nobel-mcp", version: "1.0.0" });
    server.registerTool("laureates", {
        title: "Laureates",
        description: "List Nobel laureates, optionally by year.",
        inputSchema: z.object({ year: z.number().describe("Prize year.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await laureates(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("prizes", {
        title: "Prizes",
        description: "List Nobel prizes by year.",
        inputSchema: z.object({ year: z.number().describe("Prize year.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await prizes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("laureate_detail", {
        title: "Laureate detail",
        description: "One laureate's full Nobel record: birth and death, every prize, the affiliations and the official motivation.",
        inputSchema: z.object({ id: z.number().describe("Numeric laureate id, e.g. 990 for Andrea Ghez.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("prize_detail", {
        title: "Prize detail",
        description: "The Nobel prize awarded in a year: category, award date, prize amount, every laureate and the official motivation.",
        inputSchema: z.object({ year: z.number().describe("Year, 1901 onwards."), category: z.string().describe("phys, chem, med, econ, lit or peace.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nobel-mcp";
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
