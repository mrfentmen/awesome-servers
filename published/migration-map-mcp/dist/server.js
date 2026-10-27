import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { compareProjects, migrationOrdering } from "./api.js";
import { format, inspectMigrationMap } from "./core.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "migration-map-mcp", version: "1.0.0" });
    server.registerTool("inspect_migration_map", {
        title: "Inspect migration map",
        description: "Find local migration numbering gaps and rollback pairing signals without returning SQL, paths, or migration names.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await inspectMigrationMap(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("migration_ordering", {
        title: "Migration ordering",
        description: "Read a project's own migration numbers and report ordering advice: the next free number, gaps and whether they look like deletions, numbers reused across directories, and whether file-name order and numeric order disagree. Counts and sequence numbers only.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await migrationOrdering(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("compare_projects", {
        title: "Compare projects",
        description: "Compare the migration numbering of two project paths: shared sequence numbers, which set tops out higher, whether the padding styles match and how many numbers are free in each. Counts and sequence numbers only.",
        inputSchema: z.object({
            first: z.string().min(1).max(1000).describe("First project path, relative to the configured root."),
            second: z.string().min(1).max(1000).describe("Second project path, relative to the configured root."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await compareProjects(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    const serverName = "migration-map-mcp";
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
