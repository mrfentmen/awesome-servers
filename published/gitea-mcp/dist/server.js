import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { repoDetail, searchRepos } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "gitea-mcp", version: "1.0.0" });
    server.registerTool("search_repos", {
        title: "Search repos",
        description: "Search public repositories.",
        inputSchema: z.object({ query: z.string().describe("Search query."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchRepos(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo_detail", {
        title: "Repo detail",
        description: "Get repository details.",
        inputSchema: z.object({ owner: z.string().describe("Owner name."), repo: z.string().describe("Repository name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repoDetail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_users", {
        title: "Search users",
        description: "Search the people registered on a Gitea instance by username, with follower counts, stars and last-seen dates.",
        inputSchema: z.object({ query: z.string().describe("Username or part of one."), limit: z.number().describe("Max users.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement users locally (paywall removed)
        try {
            return textError("Not yet implemented: users");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("org_profile", {
        title: "Org profile",
        description: "A Gitea organisation's public profile: description, website, location, avatar and creation date.",
        inputSchema: z.object({ org: z.string().describe("Organisation name, e.g. gitea.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "gitea-mcp";
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
