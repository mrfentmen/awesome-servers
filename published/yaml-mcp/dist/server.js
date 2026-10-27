import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseYaml } from "./api.js";
import { toJson, listOperations, listRepoContents } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "yaml-mcp", version: "1.0.0" });
    server.registerTool("parse_yaml", {
        title: "Parse yaml",
        description: "Parse YAML into a readable structure.",
        inputSchema: z.object({ yaml: z.string().describe("YAML text.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await parseYaml(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("to_json", {
        title: "To json",
        description: "Convert YAML text to JSON.",
        inputSchema: z.object({ yaml: z.string().describe("YAML text.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await toJson(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("openapi_operations", {
        title: "Openapi operations",
        description: "Download an OpenAPI or Swagger spec (JSON or YAML) from a URL and list its operations: method, path, operationId, tags and summary.",
        inputSchema: z.object({ url: z.string().describe("https URL of the spec."), limit: z.number().describe("Max operations, 1-200, default 25.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listOperations(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo_file_listing", {
        title: "Repo file listing",
        description: "List the files and directories at a path in a public GitHub repository, with type and size, so you can find the config or manifest you want to parse.",
        inputSchema: z.object({ repo: z.string().describe("Repository as owner/name, for example kubernetes/kubernetes."), path: z.string().describe("Path inside the repository. Defaults to the root.").optional(), limit: z.number().describe("Max entries, 1-100, default 30.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listRepoContents(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "yaml-mcp";
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
