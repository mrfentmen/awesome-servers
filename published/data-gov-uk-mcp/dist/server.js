import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, publisherDatasets, datasetDetail } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "data-gov-uk-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search UK open data packages.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dataset_detail", {
        title: "Dataset detail",
        description: "One data.gov.uk dataset in full: its publisher, licence, state, version, dates, tags, vocabularies and every downloadable resource with its format, its resource id and whether the table can be queried. The search tool returns only a title, a truncated note and a date.",
        inputSchema: z.object({ name: z.string().describe("The dataset slug, the part after data.gov.uk/dataset/.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await datasetDetail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("publisher_datasets", {
        title: "Publisher datasets",
        description: "Everything one publisher has put on data.gov.uk: how many datasets the catalogue holds for it and each one with its name, licence, resource count and formats and the date its metadata last changed. The search tool does free text only and cannot filter to a publisher.",
        inputSchema: z.object({ organization: z.string().describe("Publisher slug, the part after data.gov.uk/organisation/, e.g. open-data-ni. This is the name field, not the display title."), limit: z.number().describe("Max datasets, 1 to 25.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await publisherDatasets(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "data-gov-uk-mcp";
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
