import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { age, ageVersusCommonality } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "agify-mcp", version: "1.0.0" });
    server.registerTool("age", {
        title: "Age",
        description: "Estimated age for a name.",
        inputSchema: z.object({ name: z.string().describe("First name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await age(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("age_ranking", {
        title: "Age ranking",
        description: "Look up the Agify estimated age for several names at once and rank them oldest to youngest with the record count behind each estimate and the mean, median and spread.",
        inputSchema: z.object({ names: z.string().describe("Names separated by commas or newlines, e.g. John, Maria, Jean.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement ranking locally (paywall removed)
        try {
            return textError("Not yet implemented: ranking");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("name_frequency", {
        title: "Name frequency",
        description: "Compare how common a set of names are by the number of public records behind each Agify estimate, with the share of the combined total.",
        inputSchema: z.object({ names: z.string().describe("Names separated by commas or newlines.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement frequency locally (paywall removed)
        try {
            return textError("Not yet implemented: frequency");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("age_versus_commonality", {
        title: "Age versus commonality",
        description: "Compare estimated name age against record count across a set of names and report the Pearson correlation, showing whether the more common names in the set skew younger or older.",
        inputSchema: z.object({ names: z.string().describe("At least three names separated by commas or newlines.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ageVersusCommonality(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    const serverName = "agify-mcp";
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
