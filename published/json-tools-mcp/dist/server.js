import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatJson, jsonInfo, validateJson, schemaForFile } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "json-tools-mcp", version: "1.0.0" });
    server.registerTool("validate_json", {
        title: "Validate json",
        description: "Check if a string is valid JSON and report errors.",
        inputSchema: z.object({ json: z.string().describe("JSON text to check.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await validateJson(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("format_json", {
        title: "Format json",
        description: "Pretty print a JSON string.",
        inputSchema: z.object({ json: z.string().describe("JSON text to format."), indent: z.number().describe("Indent spaces.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await formatJson(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("json_info", {
        title: "Json info",
        description: "Return the top level type and key count of JSON.",
        inputSchema: z.object({ json: z.string().describe("JSON text to inspect.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await jsonInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("find_schema", {
        title: "Find schema",
        description: "Search the SchemaStore catalogue of 1400+ published JSON Schemas by topic, returning matching schema names, the config files they cover and their source URLs.",
        inputSchema: z.object({ query: z.string().min(1).max(120), limit: z.number().int().min(1).max(30).default(10) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement schema locally (paywall removed)
        try {
            return textError("Not yet implemented: schema");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("schema_for_file", {
        title: "Schema for file",
        description: "Find the JSON Schema that describes a given config file name, then report its declared type, property list, required fields, $defs sections and published versions.",
        inputSchema: z.object({ filename: z.string().min(1).max(200) }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await schemaForFile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "json-tools-mcp";
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
