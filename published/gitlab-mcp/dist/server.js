import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, projectBranches, projectDetail, projectIssues } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "gitlab-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search public GitLab projects.",
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
    server.registerTool("project_detail", {
        title: "Project detail",
        description: "Full public record of one GitLab project: description, stars, forks, open issues, visibility, default branch, language, licence, topics and dates.",
        inputSchema: z.object({ project: z.string().describe("Project as namespace/project, or its numeric id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await projectDetail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("project_issues", {
        title: "Project issues",
        description: "Issues on one public GitLab project, newest first, with state, author, labels and link.",
        inputSchema: z.object({
            project: z.string().describe("Project as namespace/project, or its numeric id."),
            state: z.enum(["opened", "closed", "all"]).default("opened").describe("Which issues to list."),
            limit: z.number().int().min(1).max(50).default(10).describe("Max issues (default 10, max 50)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await projectIssues(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("project_branches", {
        title: "Project branches",
        description: "Branches of one public GitLab project with the head commit, who committed it, when, and whether the branch is protected or default.",
        inputSchema: z.object({
            project: z.string().describe("Project as namespace/project, or its numeric id."),
            limit: z.number().int().min(1).max(100).default(10).describe("Max branches (default 10, max 100)."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await projectBranches(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "gitlab-mcp";
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
