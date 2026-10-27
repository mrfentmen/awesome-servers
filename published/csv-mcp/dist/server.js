import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { csvInfo, parseCsv } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "csv-mcp", version: "1.0.0" });
    server.registerTool("parse_csv", {
        title: "Parse csv",
        description: "Parse CSV text into a table view.",
        inputSchema: z.object({ csv: z.string().describe("CSV text."), max_rows: z.number().describe("Max rows.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await parseCsv(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("csv_info", {
        title: "Csv info",
        description: "Return columns and row count for CSV text.",
        inputSchema: z.object({ csv: z.string().describe("CSV text.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await csvInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("csv_to_json", {
        title: "CSV to JSON",
        description: "Turn CSV text into JSON records, using the first row as the object keys.",
        inputSchema: z.object({ csv: z.string().describe("CSV text."), max_rows: z.number().describe("Max records to emit.").optional(), pretty: z.boolean().describe("Indent the JSON.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement json locally (paywall removed)
        try {
            return textError("Not yet implemented: json");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("csv_validate", {
        title: "CSV validate",
        description: "Check CSV text for ragged rows, duplicate or blank headers, empty cells and a wrong delimiter.",
        inputSchema: z.object({ csv: z.string().describe("CSV text."), delimiter: z.string().describe("Expected delimiter, default comma.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement validate locally (paywall removed)
        try {
            return textError("Not yet implemented: validate");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "csv-mcp";
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
