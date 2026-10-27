import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, me, listRepos, getRepo, searchRepos, userIssues, repoIssues, repoPulls, repoCommits, getUser, searchCode, listWorkflows, repoReleases, repoContributors } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "github-mcp",
        version: "1.0.0",
    });
    server.registerTool("me", {
        title: "My profile",
        description: "Profile of the GitHub user the token belongs to.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await me());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_repos", {
        title: "List repos",
        description: "Repositories the token owner updated most recently.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listRepos(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_repo", {
        title: "Get repo",
        description: "Repository details for owner/repo, e.g. facebook/react.",
        inputSchema: z.object({
            owner: z.string().describe("Owner login."),
            repo: z.string().describe("Repo name only, e.g. react")
        }),
        annotations: READ_ONLY,
    }, async ({ owner, repo }) => {
        try {
            return text(await getRepo(owner, repo));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_repos", {
        title: "Search repos",
        description: "Public repositories matching a query, e.g. mcp server.",
        inputSchema: z.object({
            query: z.string().describe("Search text."),
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await searchRepos(query, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("user_issues", {
        title: "My issues",
        description: "Assigned open issues.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await userIssues());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("repo_issues", {
        title: "Repo issues",
        description: "Open issues in a repo.",
        inputSchema: z.object({
            owner: z.string().describe("Owner login."),
            repo: z.string().describe("Repo name.")
        }),
        annotations: READ_ONLY,
    }, async ({ owner, repo }) => {
        try {
            return text(await repoIssues(owner, repo));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("repo_pulls", {
        title: "Repo PRs",
        description: "Open pull requests.",
        inputSchema: z.object({
            owner: z.string().describe("Owner login."),
            repo: z.string().describe("Repo name.")
        }),
        annotations: READ_ONLY,
    }, async ({ owner, repo }) => {
        try {
            return text(await repoPulls(owner, repo));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("repo_commits", {
        title: "Repo commits",
        description: "Recent commits.",
        inputSchema: z.object({
            owner: z.string().describe("Owner login."),
            repo: z.string().describe("Repo name.")
        }),
        annotations: READ_ONLY,
    }, async ({ owner, repo }) => {
        try {
            return text(await repoCommits(owner, repo));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_user", {
        title: "Get user",
        description: "Public user profile.",
        inputSchema: z.object({
            username: z.string().describe("Username.")
        }),
        annotations: READ_ONLY,
    }, async ({ username }) => {
        try {
            return text(await getUser(username));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("search_code", {
        title: "Search code",
        description: "Code search.",
        inputSchema: z.object({
            query: z.string().describe("Search text.")
        }),
        annotations: READ_ONLY,
    }, async ({ query }) => {
        try {
            return text(await searchCode(query));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_workflows", {
        title: "List workflows",
        description: "Actions workflows.",
        inputSchema: z.object({
            owner: z.string().describe("Owner login."),
            repo: z.string().describe("Repo name.")
        }),
        annotations: READ_ONLY,
    }, async ({ owner, repo }) => {
        try {
            return text(await listWorkflows(owner, repo));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("repo_releases", {
        title: "Repo releases",
        description: "Published releases of a public repository: tag, name, draft or prerelease flag, publish date, release notes and attached assets. Works without a token.",
        inputSchema: z.object({
            owner: z.string().describe("Repository owner, e.g. sindresorhus"),
            repo: z.string().describe("Repository name, e.g. slugify"),
            limit: z.string().describe("Max releases (default 5, max 20).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repoReleases(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("repo_contributors", {
        title: "Repo contributors",
        description: "Contributor list of a public repository with commit counts and how concentrated the history is. Works without a token.",
        inputSchema: z.object({
            owner: z.string().describe("Repository owner, e.g. sindresorhus"),
            repo: z.string().describe("Repository name, e.g. slugify"),
            limit: z.string().describe("Max contributors (default 10, max 50).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await repoContributors(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
