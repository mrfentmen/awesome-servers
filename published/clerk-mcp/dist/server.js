import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listUsers, getUser, listSessions, listInvitations, listMemberships } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "clerk-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_users", {
        title: "List users",
        description: "Clerk users, one page at a time, with email and id.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listUsers(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_user", {
        title: "Get user",
        description: "One Clerk user by id, with profile and metadata.",
        inputSchema: z.object({
            user_id: z.string().describe("Clerk user ID, e.g. user_2abc123def")
        }),
        annotations: READ_ONLY,
    }, async ({ user_id }) => {
        try {
            return text(await getUser(user_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_sessions", {
        title: "List sessions",
        description: "Sessions in a Clerk instance, optionally filtered to one user or one client. Shows status, client, when it was last active, when it expires or abandons, device and IP from the latest activity, and how long it has been idle.",
        inputSchema: z.object({
            user_id: z.string().optional().describe("Only sessions for this user ID."),
            client_id: z.string().optional().describe("Only sessions for this client ID."),
            status: z.string().optional().describe("Filter by status: active, ended, removed, replaced or revoked."),
            limit: z.string().optional().describe("Max sessions to print, 1-100. Defaults to 20."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listSessions(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_invitations", {
        title: "List invitations",
        description: "Clerk sign-up invitations, newest first by default. Surfaces the status mix across the page and flags invitations that expired while still pending, so they can be chased or revoked.",
        inputSchema: z.object({
            status: z.string().optional().describe("Filter by status: pending, accepted, revoked or expired."),
            query: z.string().optional().describe("Filter on email address or invitation ID."),
            order_by: z.string().optional().describe("Sort field: created_at, email_address or id. Prefix with - to reverse."),
            limit: z.string().optional().describe("Max invitations to print, 1-100. Defaults to 20."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listInvitations(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_memberships", {
        title: "List organization memberships",
        description: "Everyone belonging to one Clerk organization with their role, permissions, public profile and join date. Can be narrowed to a role, a free-text query, or a last-active window, which makes it a way to find dormant admins.",
        inputSchema: z.object({
            organization_id: z.string().describe("Organization ID to list members of."),
            role: z.string().optional().describe("Only members with this role, for example org:admin."),
            query: z.string().optional().describe("Free-text match on the member's name, email, phone, username or user ID."),
            last_active_at_before: z.string().optional().describe("Only members last active before this unix timestamp or date."),
            last_active_at_after: z.string().optional().describe("Only members last active after this unix timestamp or date."),
            limit: z.string().optional().describe("Max members to print, 1-100. Defaults to 25."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listMemberships(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "clerk-mcp";
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
