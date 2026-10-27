import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listMembers, listCollections, listGroups, getEvents, listPolicies, collectionAccess, twoFactorCoverage } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "bitwarden-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_members", {
        title: "List org members",
        description: "Organization members: names, emails, status, collections access.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listMembers());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_collections", {
        title: "List collections",
        description: "Organization collections with member and group assignments.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listCollections());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_groups", {
        title: "List groups",
        description: "Organization groups with member ids and collection access.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listGroups());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_events", {
        title: "Get event logs",
        description: "Organization event log: logins, item actions, admin changes. Optional date range.",
        inputSchema: z.object({
            start: z.string().optional().describe("Start date YYYY-MM-DD"),
            end: z.string().optional().describe("End date YYYY-MM-DD"),
        }),
        annotations: READ_ONLY,
    }, async ({ start, end }) => {
        try {
            return text(await getEvents(start, end));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_policies", {
        title: "List policies",
        description: "Organization policies from the Bitwarden Public API: numeric type code, whether each is enforced, its settings and revision date.",
        inputSchema: z.object({
            continuation_token: z.string().optional().describe("Continuation token from a previous page"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listPolicies(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("collection_access", {
        title: "Collection access",
        description: "One Bitwarden collection and every group grant on it: read-only flag, whether passwords are hidden, and manage rights.",
        inputSchema: z.object({
            id: z.string().describe("Collection id (uuid)"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await collectionAccess(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("two_factor_coverage", {
        title: "Two-step login coverage",
        description: "Share of organization members with two-step login enabled, broken down by role code, with the accounts that do not have it.",
        inputSchema: z.object({
            continuation_token: z.string().optional().describe("Continuation token from a previous page"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await twoFactorCoverage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "bitwarden-mcp";
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
    return server;
}
