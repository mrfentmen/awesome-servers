import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { instantAnswer, answerDiagnostics } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "duckduckgo-mcp", version: "1.0.0" });
    server.registerTool("instant_answer", {
        title: "Instant answer",
        description: "Instant answer for a query.",
        inputSchema: z.object({ query: z.string().describe("The query.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await instantAnswer(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("entity_infobox", {
        title: "Entity infobox",
        description: "Read the structured infobox DuckDuckGo holds for an entity, giving labelled fields such as developer and first appeared, plus the official website, domain and image.",
        inputSchema: z.object({ query: z.string().describe("Entity name, e.g. Rust."), limit: z.number().describe("Max fields.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement infobox locally (paywall removed)
        try {
            return textError("Not yet implemented: infobox");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("web_results", {
        title: "Web results",
        description: "Fetch DuckDuckGo's web results for a query as clean title and URL pairs, parsed out of the raw result markup, along with related topics and the entity heading.",
        inputSchema: z.object({ query: z.string().describe("Search query."), limit: z.number().describe("Max results.").optional(), region: z.string().describe("Region code such as wt-wt or us-en.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement results locally (paywall removed)
        try {
            return textError("Not yet implemented: results");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("answer_diagnostics", {
        title: "Answer diagnostics",
        description: "Explain what DuckDuckGo actually returned for a query by reporting which Instant Answer fields were populated, which were empty and whether related topics nest, so an empty result is not a dead end.",
        inputSchema: z.object({ query: z.string().describe("Query to diagnose.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await answerDiagnostics(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "duckduckgo-mcp";
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
