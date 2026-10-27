import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, forecast } from "./forecaster.js";
import { commitCadence, objectStore, repositoryHealth } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : "Local merge forecast failed"}`);
export function createServer() {
    const server = new McpServer({ name: "merge-conflict-forecaster-mcp", version: "1.0.0" });
    server.registerTool("forecast_merge_conflicts", {
        title: "Forecast merge conflicts",
        description: "Estimate local Git merge-conflict pressure from branch topology and changed-file overlap without returning source content.",
        inputSchema: z.object({
            cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path inside the configured workspace; no network access is used."),
            base: z.string().min(1).max(300).optional().describe("Optional local branch name used as the comparison base."),
            limit: z.number().int().min(1).max(40).default(20).describe("Maximum number of local branches to analyze."),
        }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(format(await forecast(input)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("commit_cadence", {
        title: "Commit cadence",
        description: "Shape of the local commit history at HEAD: total commits, date span, median and longest gap, commits per month and per weekday, and how many distinct committer addresses appear. Never returns messages, hashes or identities.",
        inputSchema: z.object({
            cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path inside the configured workspace; no network access is used."),
            months: z.number().int().min(1).max(36).default(12).describe("How many months of history to break down by month, 1 to 36."),
        }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(await commitCadence(input));
        }
        catch (e) {
            return errorText(e);
        }
    });
    server.registerTool("repository_health", {
        title: "Repository health",
        description: "State of the local work tree: bare or shallow, HEAD attached or detached, commits reachable, uncommitted paths grouped by git status code, stash entries, and any merge, rebase, cherry-pick, revert or bisect left in progress.",
        inputSchema: z.object({
            cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path inside the configured workspace; no network access is used."),
        }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(await repositoryHealth(input));
        }
        catch (e) {
            return errorText(e);
        }
    });
    server.registerTool("object_store", {
        title: "Object store",
        description: "Local object store and ref namespace from git's own counters: loose and packed objects, pack files and sizes, pruneable and garbage counts, commits reachable from every ref, and the count in each ref namespace.",
        inputSchema: z.object({
            cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path inside the configured workspace; no network access is used."),
        }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(await objectStore(input));
        }
        catch (e) {
            return errorText(e);
        }
    });
    const serverName = "merge-conflict-forecaster-mcp";
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
