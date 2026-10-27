import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { animal } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "random-animals-mcp", version: "1.0.0" });
    server.registerTool("animal", {
        title: "Animal",
        description: "A random animal photo with a fact.",
        inputSchema: z.object({ type: z.string().describe("dog, cat, fox, bird, panda, koala, duck.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await animal(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("species_facts", {
        title: "Species facts",
        description: "Look up a species on iNaturalist: scientific and common name, rank, conservation status, Wikipedia link and observation count.",
        inputSchema: z.object({ query: z.string().describe("Species or group name, for example 'red panda'."), limit: z.number().describe("Max species, 1-10, default 3.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement facts locally (paywall removed)
        try {
            return textError("Not yet implemented: facts");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("species_observations", {
        title: "Species observations",
        description: "Recent research grade observations of a species on iNaturalist, with date, place, observer and a licensed photo.",
        inputSchema: z.object({ query: z.string().describe("Species name, for example 'red panda'."), limit: z.number().describe("Max observations, 1-20, default 5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement observations locally (paywall removed)
        try {
            return textError("Not yet implemented: observations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "random-animals-mcp";
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
