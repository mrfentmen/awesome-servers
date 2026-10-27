import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { repo, repos } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "bitbucket-mcp", version: "1.0.0" });
    server.registerTool("repos", {
        title: "Repos",
        description: "List repos for a workspace.",
        inputSchema: z.object({ workspace: z.string().describe("Workspace slug."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repos(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo", {
        title: "Repo",
        description: "Get a repo.",
        inputSchema: z.object({ workspace: z.string().describe("Workspace slug."), repo: z.string().describe("Repo name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("workspace", {
        title: "Workspace",
        description: "A Bitbucket workspace's own record: its uuid, html link, whether it is private and whether privacy is enforced.",
        inputSchema: z.object({ workspace: z.string().describe("Workspace slug, e.g. atlassian."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement workspace locally (paywall removed)
        try {
            return textError("Not yet implemented: workspace");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo_commits", {
        title: "Repo commits",
        description: "A public Bitbucket repository's commit history, newest first, with author, date and short hash.",
        inputSchema: z.object({ workspace: z.string().describe("Workspace slug."), repo: z.string().describe("Repository name."), limit: z.number().describe("Max commits.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement commits locally (paywall removed)
        try {
            return textError("Not yet implemented: commits");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo_pull_requests", {
        title: "Repo pull requests",
        description: "A public Bitbucket repository's pull requests filtered by state, with author, branches and html link.",
        inputSchema: z.object({ workspace: z.string().describe("Workspace slug."), repo: z.string().describe("Repository name."), state: z.string().describe("OPEN, MERGED, DECLINED, SUPERSEDED or ALL.").optional(), limit: z.number().describe("Max pull requests.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement requests locally (paywall removed)
        try {
            return textError("Not yet implemented: requests");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bitbucket-mcp";
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
