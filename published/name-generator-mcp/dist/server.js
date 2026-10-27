import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { codename, randomName, username } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "name-generator-mcp", version: "1.0.0" });
    server.registerTool("random_name", {
        title: "Random name",
        description: "Generate a random full name.",
        inputSchema: z.object({ count: z.number().describe("How many.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await randomName(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("username", {
        title: "Username",
        description: "Generate a random username.",
        inputSchema: z.object({ count: z.number().describe("How many.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await username(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("codename", {
        title: "Codename",
        description: "Generate a random project codename.",
        inputSchema: z.object({ count: z.number().describe("How many.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await codename(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_status", {
        title: "Domain status",
        description: "Check whether a domain name is already registered, using the registry's RDAP record: registrar, registration and expiry dates, status and name servers.",
        inputSchema: z.object({ domain: z.string().describe("Domain to check, for example anthropic.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement status locally (paywall removed)
        try {
            return textError("Not yet implemented: status");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("suggest_words", {
        title: "Suggest words",
        description: "Find real English words related to a seed word, with corpus frequency and an optional definition, for naming projects and codenames.",
        inputSchema: z.object({ relatedTo: z.string().describe("Seed word, for example falcon."), limit: z.number().describe("Max words, 1-20, default 8.").optional(), definition: z.boolean().describe("Include a short definition for each word.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement words locally (paywall removed)
        try {
            return textError("Not yet implemented: words");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "name-generator-mcp";
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
