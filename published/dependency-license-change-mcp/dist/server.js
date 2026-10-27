import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, compareLicenseEvidence } from "./core.js";
import { snapshotProfile } from "./api.js";
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const text = (value) => ({ content: [{ type: "text", text: value }] });
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "dependency-license-change-mcp", version: "1.0.0" });
    server.registerTool("compare_license_evidence", {
        title: "Compare license evidence",
        description: "Compare local license evidence across two snapshots without returning package names, text, paths, or source.",
        inputSchema: z.object({ before: z.string().min(1).max(1000), after: z.string().min(1).max(1000) }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await compareLicenseEvidence(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("snapshot_profile", {
        title: "Snapshot profile",
        description: "Profile one snapshot on its own: how many licence bearing files it holds, the count and share of every category, the dominant one and whether anything falls in the strong copyleft family. The compare_license_evidence tool only reports categories whose count moved between two snapshots, so it cannot show a single snapshot or a category that held steady.",
        inputSchema: z.object({ path: z.string().min(1).max(1000).describe("Snapshot path, relative to the configured root or absolute.") }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(await snapshotProfile(input));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("category_matrix", {
        title: "Category matrix",
        description: "Every licence category across two snapshots, changed or not, each with its before and after count, its share, the size of the move and the categories that held steady. The compare_license_evidence tool omits the unchanged categories entirely, so a flat movement is invisible there.",
        inputSchema: z.object({ before: z.string().min(1).max(1000).describe("First snapshot path."), after: z.string().min(1).max(1000).describe("Second snapshot path.") }),
        annotations: READ_ONLY,
    }, async (input) => {
        // TODO: implement matrix locally (paywall removed)
        try {
            return textError("Not yet implemented: matrix");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "dependency-license-change-mcp";
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
