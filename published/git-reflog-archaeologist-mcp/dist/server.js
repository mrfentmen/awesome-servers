import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, recoverySignals, reflogSignals, stashSignals } from "./archaeology.js";
import { recoverableObjectWindow, reflogActivityProfile } from "./local-api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : "Local Git archaeology failed"}`);
export function createServer() {
    const server = new McpServer({ name: "git-reflog-archaeologist-mcp", version: "1.0.0" });
    const cwd = z.string().min(1).max(1000).default(".").describe("Local Git repository path; no network access is used.");
    server.registerTool("reflog_signals", {
        title: "Reflog signals",
        description: "Summarize local reflog activity by count and age bucket without returning ref names, hashes, subjects, paths, or remotes.",
        inputSchema: z.object({ cwd }),
        annotations: READ_ONLY,
    }, async ({ cwd: directory }) => { try {
        return text(format(await reflogSignals(directory)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("recovery_signals", {
        title: "Recovery signals",
        description: "Count unreachable Git object types and recovery hints without returning object IDs, messages, paths, or contents.",
        inputSchema: z.object({ cwd }),
        annotations: READ_ONLY,
    }, async ({ cwd: directory }) => { try {
        return text(format(await recoverySignals(directory)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("stash_signals", {
        title: "Stash signals",
        description: "Summarize local stash age buckets and count without returning stash messages, refs, hashes, or paths.",
        inputSchema: z.object({ cwd }),
        annotations: READ_ONLY,
    }, async ({ cwd: directory }) => { try {
        return text(format(await stashSignals(directory)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("reflog_activity_profile", {
        title: "Reflog activity profile",
        description: "Sessionise local reflog activity: active days, longest consecutive-day streak, per-day entry density, inter-entry gap percentiles, recent-versus-older split, weekday-spread entropy and an activity shape. No ref names, hashes, subjects or timestamps are returned.",
        inputSchema: z.object({ cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path; no network access is used.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await reflogActivityProfile(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("recoverable_object_window", {
        title: "Recoverable object window",
        description: "Cross-check objects that are unreachable from every ref against the local reflog and report how many are still named by a reflog entry, broken down by object type. Object IDs, messages, paths and refs are never returned.",
        inputSchema: z.object({ cwd: z.string().min(1).max(1000).default(".").describe("Local Git repository path; no network access is used.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recoverableObjectWindow(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("public_commit_provenance", {
        title: "Public commit provenance",
        description: "Inspect GitHub-reported commit signature verification, author and committer dates, parent count and change totals for a public revision.",
        inputSchema: z.object({ owner: z.string().min(1).max(100).default("microsoft"), repo: z.string().min(1).max(100).default("TypeScript"), ref: z.string().min(1).max(200).default("main") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement provenance locally (paywall removed)
        try {
            return textError("Not yet implemented: provenance");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "git-reflog-archaeologist-mcp";
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
    return server;
}
function error(e) { return e instanceof Error ? e.message : String(e); }
