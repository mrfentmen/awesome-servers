import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { info, releaseHistory, versionDetail } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "deps-dev-mcp", version: "1.0.0" });
    server.registerTool("info", {
        title: "Info",
        description: "Dependency data for one package version.",
        inputSchema: z.object({ system: z.string().describe("Ecosystem like npm or pypi."), name: z.string().describe("Package name."), version: z.string().describe("Version.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await info(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("release_history", {
        title: "Release history",
        description: "How a package has been released over time: the version count, the first and latest publish dates, how many versions are deprecated and how many major versions exist. The info tool prints only the fields at the top level of the response, which carry no version list.",
        inputSchema: z.object({ system: z.string().describe("Ecosystem like npm, pypi, maven, go or cargo."), name: z.string().describe("Package name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await releaseHistory(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("version_detail", {
        title: "Version detail",
        description: "Everything deps.dev holds about one version: its licences, advisories, registries, provenance records, related source projects and links.",
        inputSchema: z.object({ system: z.string().describe("Ecosystem like npm, pypi, maven, go or cargo."), name: z.string().describe("Package name."), version: z.string().describe("The exact version to look up.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await versionDetail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "deps-dev-mcp";
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
