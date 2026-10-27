import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, mirrorStatus } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "archlinux-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Arch Linux packages.",
        inputSchema: z.object({ query: z.string().describe("Package query."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("package_details", {
        title: "Package details",
        description: "Full metadata for one Arch package by exact name: maintainers, licences, build date, sizes and the whole dependency graph.",
        inputSchema: z.object({ name: z.string().describe("Exact package name, e.g. linux.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reverse_dependencies", {
        title: "Reverse dependencies",
        description: "Find the Arch packages that depend on a package, or that provide a virtual capability, grouped by repository.",
        inputSchema: z.object({ name: z.string().describe("Package or capability name."), kind: z.string().describe("depends or provides.").optional(), limit: z.number().describe("Max packages.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement dependencies locally (paywall removed)
        try {
            return textError("Not yet implemented: dependencies");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mirror_status", {
        title: "Mirror status",
        description: "Arch mirrors ranked by score with delay, sync time, completion and protocols, optionally filtered to a country.",
        inputSchema: z.object({ country: z.string().describe("Country name fragment, e.g. Germany.").optional(), limit: z.number().describe("Max mirrors.").optional(), active_only: z.boolean().describe("Only active mirrors.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await mirrorStatus(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "archlinux-mcp";
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
