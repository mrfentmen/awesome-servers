import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { badge } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "shields-mcp", version: "1.0.0" });
    server.registerTool("badge", {
        title: "Badge",
        description: "Build a badge URL.",
        inputSchema: z.object({ label: z.string().describe("Label text."), message: z.string().describe("Message text."), color: z.string().describe("Color like green.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await badge(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("package_version", {
        title: "Package version",
        description: "The latest published version of a package, read live from Shields.io for npm, PyPI, crates.io, NuGet, Packagist or RubyGems.",
        inputSchema: z.object({ ecosystem: z.enum(["npm", "pypi", "crates", "nuget", "packagist", "gem"]).describe("Registry the package lives in"), packageName: z.string().min(1).max(120).describe("Package name") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement version locally (paywall removed)
        try {
            return textError("Not yet implemented: version");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo_badge", {
        title: "Repo badge",
        description: "A live GitHub repository metric from Shields.io: stars, forks, open and closed issues, contributors, last commit, release date, repo size or commit activity.",
        inputSchema: z.object({ owner: z.string().min(1).max(60).describe("Repository owner"), repo: z.string().min(1).max(80).describe("Repository name"), metric: z.enum(["stars", "forks", "issues", "issues-closed", "contributors", "last-commit", "release-date", "repo-size", "commit-activity-y", "commit-activity-m"]).describe("Which metric to read") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement badge locally (paywall removed)
        try {
            return textError("Not yet implemented: badge");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "shields-mcp";
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
