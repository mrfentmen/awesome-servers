const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, inspectDependencyDrift, inspectInstallScripts, inspectLockIntegrity } from "./drift.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "dependency-drift-mcp", version: "1.0.0" });
    server.registerTool("inspect_dependency_drift", {
        title: "Inspect dependency drift",
        description: "Summarize local dependency manifest and lockfile drift without returning package names, versions, paths, or file contents.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs or commands") }),
        annotations: READ_ONLY,
    }, async ({ project }) => {
        try {
            return text(format(await inspectDependencyDrift(project)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("inspect_install_scripts", {
        title: "Inspect install scripts",
        description: "Count npm lifecycle hook scripts across local manifests without returning package names, script bodies, paths, or file contents.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs or commands") }),
        annotations: READ_ONLY,
    }, async ({ project }) => {
        try {
            return text(format(await inspectInstallScripts(project)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("inspect_lock_integrity", {
        title: "Inspect lock integrity",
        description: "Count npm lockfile entries that carry or lack integrity and resolved fields, without returning package names, hashes, URLs, or paths.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs or commands") }),
        annotations: READ_ONLY,
    }, async ({ project }) => {
        try {
            return text(format(await inspectLockIntegrity(project)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("npm_release_metadata", {
        title: "Npm release metadata",
        description: "Fetch the current npm latest-tag release, engine constraints, dependencies and distribution integrity without reading a local manifest. Defaults to zod.",
        inputSchema: z.object({ package: z.string().max(214).optional() }),
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
    server.registerTool("npm_version_advisories", {
        title: "Npm version advisories",
        description: "Query OSV for vulnerabilities affecting an exact npm package version, including reported fixed versions. Defaults to lodash 4.17.20; reads no local files.",
        inputSchema: z.object({ package: z.string().max(214).optional(), version: z.string().max(100).optional(), limit: z.number().int().min(1).max(30).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement advisories locally (paywall removed)
        try {
            return textError("Not yet implemented: advisories");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "dependency-drift-mcp";
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
