import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCapabilities, listShares, getShare, createShare, serverStatus } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "owncloud-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_capabilities", {
        title: "Capabilities",
        description: "ownCloud server capabilities. Public on most servers.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getCapabilities());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_shares", {
        title: "List shares",
        description: "All file/folder shares (requires login).",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listShares());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_share", {
        title: "Get share",
        description: "Share details by ID (requires login).",
        inputSchema: z.object({
            share_id: z.string().describe("Numeric share ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ share_id }) => {
        try {
            return text(await getShare(share_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_share", {
        title: "Create share",
        description: "Share a file/folder: 0=user 1=group 3=public link (requires login).",
        inputSchema: z.object({
            path: z.string().describe("Server path to share."),
            share_type: z.string().describe("0, 1 or 3."),
            share_with: z.string().describe("User/group ID (types 0/1).").optional()
        }),
        annotations: MUTATING,
    }, async ({ path, share_type, share_with }) => {
        try {
            return text(await createShare(path, share_type, share_with));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("server_status", {
        title: "Server status",
        description: "ownCloud installation status from /status.php: product, version, edition, maintenance mode and pending database upgrade. Needs no login.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await serverStatus());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "owncloud-mcp";
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
