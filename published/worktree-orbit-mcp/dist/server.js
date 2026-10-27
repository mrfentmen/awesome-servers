import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, inspectTopology } from "./orbit.js";
import { worktreeAgeProfile, worktreeDivergenceProfile } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : "Local worktree inspection failed"}`);
export function createServer() {
    const server = new McpServer({ name: "worktree-orbit-mcp", version: "1.0.0" });
    const serverName = "worktree-orbit-mcp";
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
    server.registerTool("inspect_worktree_topology", {
        title: "Inspect worktree topology",
        description: "Summarize local Git worktree topology, clean or dirty state, detached worktrees, locks, and prunable entries without exposing paths, branch names, hashes, remotes, or content.",
        inputSchema: z.object({ cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path; no network access is used.") }),
        annotations: READ_ONLY,
    }, async ({ cwd }) => { try {
        return text(format(await inspectTopology(cwd)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("worktree_divergence_profile", {
        title: "Worktree divergence profile",
        description: "Measure every linked Git worktree against the primary HEAD and report commits ahead and behind, clean or dirty state and an in-sync, ahead-only, behind-only or diverged verdict per worktree index. Paths, branch names and hashes are never returned.",
        inputSchema: z.object({ cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path; no network access is used.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await worktreeDivergenceProfile(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("worktree_age_profile", {
        title: "Worktree age profile",
        description: "Bucket every local Git worktree by the age of its administrative metadata, flag locked and prunable entries, and count how many look abandoned at 30 days or more. Paths, branch names and contents are never returned.",
        inputSchema: z.object({ cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path; no network access is used.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await worktreeAgeProfile(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    ;
    return server;
}
