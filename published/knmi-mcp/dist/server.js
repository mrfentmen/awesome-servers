import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listDatasets, listVersions, listFiles, getFile, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "knmi-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_datasets", {
        title: "List datasets",
        description: "KNMI open datasets: weather stations, radar, climate series, forecasts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listDatasets());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_versions", {
        title: "List dataset versions",
        description: "Available versions of a KNMI dataset.",
        inputSchema: z.object({
            dataset: z.string().describe("Dataset name, e.g. 'Actuele10mindataKNMIstations'"),
        }),
        annotations: READ_ONLY,
    }, async ({ dataset }) => {
        try {
            return text(await listVersions(dataset));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_files", {
        title: "List dataset files",
        description: "Files in a KNMI dataset version with sizes and download links.",
        inputSchema: z.object({
            dataset: z.string().describe("Dataset name"),
            version: z.string().describe("Version, e.g. '1'"),
            maxKeys: z.number().default(20).describe("How many files"),
        }),
        annotations: READ_ONLY,
    }, async ({ dataset, version, maxKeys }) => {
        try {
            return text(await listFiles(dataset, version, maxKeys));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_file", {
        title: "Download dataset file",
        description: "Download one KNMI dataset file (CSV/BUFR/NetCDF metadata) as text, truncated.",
        inputSchema: z.object({
            dataset: z.string().describe("Dataset name"),
            version: z.string().describe("Version"),
            filename: z.string().describe("File name from list_files"),
        }),
        annotations: READ_ONLY,
    }, async ({ dataset, version, filename }) => {
        try {
            return text(await getFile(dataset, version, filename));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "knmi-mcp";
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
