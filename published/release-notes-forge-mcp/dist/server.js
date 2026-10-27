import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, summarizeReleaseHistory } from "./core.js";
import { reviewChangelogCoverage } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "release-notes-forge-mcp", version: "1.0.0" });
    server.registerTool("summarize_release_history", {
        title: "Summarize release history",
        description: "Summarize local Git release shape without returning commit messages, paths, hashes, or remotes.",
        inputSchema: z.object({ cwd: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await summarizeReleaseHistory(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("draft_release_digest", {
        title: "Draft release digest",
        description: "Turn commit subjects you supply into a release digest: conventional-type histogram, breaking-change count, distinct scope count, subject-length check, a suggested Keep a Changelog section order and a recommended semver impact. Subject text, scope labels and author identities are never returned.",
        inputSchema: z.object({ subjects: z.array(z.string().max(1000)).min(1).max(500).describe("Commit subject lines, up to 500 of 1000 characters each.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement digest locally (paywall removed)
        try {
            return textError("Not yet implemented: digest");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("review_changelog_coverage", {
        title: "Review changelog coverage",
        description: "Audit changelog text you supply: release and unreleased heading counts, entry counts, conventional-type coverage, per-section entry counts, duplicate entries, missing or empty Keep a Changelog sections and a releasability verdict. Entry text is never returned.",
        inputSchema: z.object({ changelog: z.string().min(1).max(200000).describe("Changelog text to review, up to 200,000 characters.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await reviewChangelogCoverage(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    const serverName = "release-notes-forge-mcp";
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
