import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, inspectRuntimeSupport } from "./core.js";
import { runtimeConstraintSpread, runtimeSupportMatrix } from "./api.js";
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const text = (value) => ({ content: [{ type: "text", text: value }] });
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "runtime-support-mcp", version: "1.0.0" });
    const serverName = "runtime-support-mcp";
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
    server.registerTool("inspect_runtime_support", {
        title: "Inspect runtime support",
        description: "Summarize runtime declarations across local manifests and CI files without returning versions, paths, or source.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await inspectRuntimeSupport(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("runtime_support_matrix", {
        title: "Runtime support matrix",
        description: "Build a runtime family by file-category matrix from local manifests, pin files, container files and CI files, then report per-family coverage, version-constraint presence and the gaps. Values, paths and filenames are never returned.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await runtimeSupportMatrix(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("runtime_constraint_spread", {
        title: "Runtime constraint spread",
        description: "Measure how many distinct major versions each runtime family names across local manifests and CI files, and flag families whose constraints contradict each other. Exact versions are never returned, only counts and spreads.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await runtimeConstraintSpread(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    return server;
}
