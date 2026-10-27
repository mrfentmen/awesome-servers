import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generate, paragraphs } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "baconipsum-mcp", version: "1.0.0" });
    server.registerTool("generate", {
        title: "Generate",
        description: "Generate placeholder text.",
        inputSchema: z.object({ type: z.string().describe("meat-and-filler or all-meat.").optional(), sentences: z.number().describe("Number of sentences.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("paragraphs", {
        title: "Paragraphs",
        description: "Bacon Ipsum as real paragraph blocks rather than one blob, in JSON, HTML or plain text, with the optional traditional lorem opener. The type is checked here because the API answers with its default text for a type it does not know.",
        inputSchema: z.object({ paras: z.number().describe("How many paragraphs, 1-10. Defaults to 3.").optional(), type: z.string().describe("meat-and-filler or all-meat. Defaults to meat-and-filler.").optional(), startWithLorem: z.boolean().describe("Start with 'Bacon ipsum dolor amet' instead of random words.").optional(), format: z.string().describe("json, html or text. Defaults to json.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await paragraphs(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "baconipsum-mcp";
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
    server.registerTool("status", {
        title: "Status",
        description: "Get server status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("Server is running normally.");
    });
    return server;
}
