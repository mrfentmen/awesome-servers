import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { rants, rantDigest } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "devrant-mcp", version: "1.0.0" });
    server.registerTool("rants", {
        title: "Rants",
        description: "Get recent rants.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await rants(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rant_details", {
        title: "Rant details",
        description: "One devRant rant opened in full: the author and their score, the real score, the tags, the links embedded in the text, whether it is marked special or edited, and the whole comment thread ranked by score with the ten best shown. The rants tool prints one truncated line per rant and never opens one.",
        inputSchema: z.object({ rant_id: z.number().describe("Rant id, like 194632."), app: z.number().describe("devRant app id, 3 is the public one.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rant_digest", {
        title: "Rant digest",
        description: "The totals for one page of devRant rants rather than a list of them: the score and comment distribution with highest, median and lowest, how many rants carry no comments at all, how many are special or edited or have an image, the post time span, the tag tally and the most active authors. The rants tool prints rows, never totals.",
        inputSchema: z.object({ app: z.number().describe("devRant app id, 3 is the public one.").optional(), sort: z.string().describe("algo, new, hot or top.").optional(), limit: z.number().describe("How many rants to fetch, 1 to 50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await rantDigest(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "devrant-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
