import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatOrg, formatUser, listOrganizations, listUsers, ZitadelError, audit_users, credential_report, org_coverage } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "zitadel-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_users", {
        title: "List users",
        description: "Zitadel human users with emails and states.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listUsers(limit);
            if (rows.length === 0)
                return text("No users.");
            return text(rows.map((u, i) => formatUser(u, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_organizations", {
        title: "List organizations",
        description: "Zitadel organizations.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listOrganizations(limit);
            if (rows.length === 0)
                return text("No organizations.");
            return text(rows.map((o, i) => formatOrg(o, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("audit_users", {
        title: "Audit users",
        description: "Account hygiene across a Zitadel instance, from the /v2/users payload: how many accounts are human against machine, the state distribution, how many have no login name at all and so cannot log in, how many human accounts have no email or an unverified one, which are not in the active state, which have gone untouched for over a year, and which login name domains are in use. list_users prints a username, an email and a state, so a locked-out account, a service credential and an active person all look alike.",
        inputSchema: z.object({
            users: z.array(z.object({}).passthrough()).describe("The result array from a Zitadel /v2/users response. id, state, userName, loginNames, preferredLoginName, human.email, machine and details are read."),
            now: z.string().optional().describe("Judge staleness against this ISO date instead of today, so the report is reproducible. Default is now."),
        }),
        annotations: READ_ONLY,
    }, async ({ users, now }) => {
        try {
            return text(audit_users({ users, now }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("credential_report", {
        title: "Credential report",
        description: "Separate the people from the machine credentials in a Zitadel user list: which accounts are machine accounts, which of those hold a secret, what access token type each uses, how many login names per account and which accounts are reachable by more than one identifier, and whether the preferredLoginName is actually one of the login names. A machine account and a locked-out human are indistinguishable in the existing list_users output.",
        inputSchema: z.object({
            users: z.array(z.object({}).passthrough()).describe("The result array from a Zitadel /v2/users response. The machine block and loginNames are read."),
        }),
        annotations: READ_ONLY,
    }, async ({ users }) => {
        try {
            return text(credential_report({ users }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("org_coverage", {
        title: "Organisation coverage",
        description: "Report how a Zitadel user list is spread across organisations: users per organisation with their state breakdown, organisations that hold no user at all, and organisation names used more than once. Says plainly when the payload carries no orgId and membership cannot be attributed, rather than guessing. list_organizations prints a name and a state and never relates either to the user list.",
        inputSchema: z.object({
            users: z.array(z.object({}).passthrough()).describe("The result array from a Zitadel /v2/users response. orgId is read when present."),
            organizations: z.array(z.object({}).passthrough()).optional().describe("Optionally the array from /v2/organizations, with organizationId, name and state, so organisations can be named."),
        }),
        annotations: READ_ONLY,
    }, async ({ users, organizations }) => {
        try {
            return text(org_coverage({ users, organizations }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "zitadel-mcp";
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
function errorMessage(e) {
    if (e instanceof ZitadelError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
