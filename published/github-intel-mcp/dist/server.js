import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { repo } from "./api.js";
import { searchRepos } from "./api.js";
import { userRepos, repoLanguages, repoReleases, repoContributors, userProfile } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "github-intel-mcp", version: "1.0.0" });
    server.registerTool("search_repos", {
        title: "Search repos",
        description: "Search GitHub repositories by query sorted by stars.",
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
    server.registerTool("get_repo", {
        title: "Get repo",
        description: "Get details for one repository.",
        inputSchema: z.object({ owner: z.string().describe("Owner name."), repo: z.string().describe("Repository name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_user_repos", {
        title: "Get user repos",
        description: "List repositories for a GitHub user.",
        inputSchema: z.object({ username: z.string().describe("GitHub username."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await userRepos(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo_languages", {
        title: "Repo languages",
        description: "The real language mix of a repository, by the bytes GitHub counts, with each language's share and the repository's own primary language field.",
        inputSchema: z.object({ owner: z.string().describe("Owner name."), repo: z.string().describe("Repository name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repoLanguages(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo_releases", {
        title: "Repo releases",
        description: "Recent releases of a repository: tag, publish date, prerelease and draft flags, asset count and download total, and a bounded slice of the release notes.",
        inputSchema: z.object({ owner: z.string().describe("Owner name."), repo: z.string().describe("Repository name."), limit: z.number().describe("Max releases, 1-25.").optional(), notes: z.number().describe("Characters of release notes to keep per release, 0-2000.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repoReleases(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo_contributors", {
        title: "Repo contributors",
        description: "Who carries a repository: the top contributors by commit count with each one's share of the page, and how concentrated the top two are.",
        inputSchema: z.object({ owner: z.string().describe("Owner name."), repo: z.string().describe("Repository name."), limit: z.number().describe("Max contributors, 1-50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repoContributors(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("user_profile", {
        title: "User profile",
        description: "A GitHub account in full: display name, account type, join date and age, public repository and follower counts, company, location, website and bio.",
        inputSchema: z.object({ username: z.string().describe("GitHub username.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await userProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "github-intel-mcp";
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
    return server;
}
