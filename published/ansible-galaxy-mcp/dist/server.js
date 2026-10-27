import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { collection, collections, collectionReleaseHistory } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ansible-galaxy-mcp", version: "1.0.0" });
    server.registerTool("collections", {
        title: "Collections",
        description: "Search Ansible collections.",
        inputSchema: z.object({ search: z.string().describe("Optional search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await collections(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("collection", {
        title: "Collection",
        description: "Details for one collection.",
        inputSchema: z.object({ namespace: z.string().describe("Namespace."), name: z.string().describe("Collection name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await collection(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("collection_release_history", {
        title: "Collection release history",
        description: "Every released version of one Ansible collection with its publish date and the ansible core version it requires, so you can see the maintenance branches and how old each one is. The collection tool only looks at the newest release.",
        inputSchema: z.object({ namespace: z.string().describe("Namespace, like community."), name: z.string().describe("Collection name, like general.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await collectionReleaseHistory(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("collection_contents", {
        title: "Collection contents",
        description: "What one released version of an Ansible collection actually contains: the sha256 and size of the tarball, the licence, the source commit, the collections it depends on and every plugin type it ships with a count and examples. The collection tool never returns any of this.",
        inputSchema: z.object({ namespace: z.string().describe("Namespace, like community."), name: z.string().describe("Collection name, like general."), version: z.string().describe("The exact version to inspect, like 13.4.0.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement contents locally (paywall removed)
        try {
            return textError("Not yet implemented: contents");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ansible-galaxy-mcp";
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
