import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchSnippets, codeSnippetSearch, snippetProfile } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "publicwww-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_snippets", {
        title: "Snippet search",
        description: "URLs of sites containing a code snippet.",
        inputSchema: z.object({
            keywords: z.string().describe("Snippet text, e.g. jquery.")
        }),
        annotations: READ_ONLY,
    }, async ({ keywords }) => {
        try {
            return text(await searchSnippets(keywords));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("code_snippet_search", {
        title: "Search published source code",
        description: "Search the open Sourcegraph code index for a literal string and report which repositories use it, where, and on which lines. Searches published source rather than live web pages.",
        inputSchema: z.object({
            snippet: z.string().describe("Literal text to find, e.g. 'export class McpServer' or 'BreweryDB'"),
            limit: z.number().describe("Max matches, 1-25. Defaults to 10.").optional(),
            language: z.string().describe("Restrict to one language, e.g. 'TypeScript' or 'Go'.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await codeSnippetSearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("snippet_profile", {
        title: "Profile a snippet",
        description: "Profile a snippet before searching for it: Shannon entropy per character, minification and comment ratios, longest line, and a verdict on whether it is worth searching as a literal.",
        inputSchema: z.object({
            snippet: z.string().describe("The snippet to profile, up to 200,000 characters"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await snippetProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "publicwww-mcp";
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
