import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, inspectBuildCache, artifactBreakdown, reclaimableCache } from "./core.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "build-cache-mcp", version: "1.0.0" });
    server.registerTool("inspect_build_cache", {
        title: "Inspect build cache",
        description: "Summarize local build and cache footprint using size and age buckets without returning paths or file contents.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await inspectBuildCache(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("artifact_breakdown", {
        title: "Artifact breakdown",
        description: "Split a project's build and cache footprint by cache kind, with byte share, file counts and write dates.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(await artifactBreakdown(input));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("reclaimable_cache", {
        title: "Reclaimable cache",
        description: "How much build cache is older than a week and could be dropped for a cold rebuild, by cache kind.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(await reclaimableCache(input));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("npm_package_metadata", {
        title: "npm package metadata",
        description: "Read live npm package tarball size, file count, integrity, engine requirements and modified time.",
        inputSchema: z.object({ package: z.string().describe("npm package name; defaults to typescript.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement metadata locally (paywall removed)
        try {
            return textError("Not yet implemented: metadata");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("github_latest_release", {
        title: "GitHub latest release",
        description: "Read the latest GitHub release and bounded asset size and download counts.",
        inputSchema: z.object({ owner: z.string().describe("GitHub owner; defaults to cli.").optional(), repo: z.string().describe("GitHub repository; defaults to cli.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement release locally (paywall removed)
        try {
            return textError("Not yet implemented: release");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "build-cache-mcp";
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
