import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lei, search } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "gleif-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search legal entities.",
        inputSchema: z.object({ query: z.string().describe("Entity name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("lei", {
        title: "Lei",
        description: "Get a record by LEI.",
        inputSchema: z.object({ id: z.string().describe("LEI code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lei(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("lei_identifiers", {
        title: "Lei identifiers",
        description: "Cross references and registration history for one LEI: national registration number, LOU, status and validity dates, direct and ultimate parent, and the BIC, MIC, GEM, QCC and OCID identifiers GLEIF holds.",
        inputSchema: z.object({ id: z.string().describe("20 character LEI code, e.g. '529900PZALZWTFHKJ345'."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement identifiers locally (paywall removed)
        try {
            return textError("Not yet implemented: identifiers");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("entities_by_country", {
        title: "Entities by country",
        description: "List legal entities whose LEI is registered in a given ISO country, with the total GLEIF holds for that country.",
        inputSchema: z.object({ country: z.string().describe("Two letter ISO country code, e.g. 'CH' or 'DE'."), limit: z.number().describe("Max entities, 1-100, default 15.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement country locally (paywall removed)
        try {
            return textError("Not yet implemented: country");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "gleif-mcp";
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
