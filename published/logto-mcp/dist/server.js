import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listApplications, listUsers, LogtoError, tenantDiscovery, signingKeys, tokenInspect } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "logto-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_users", {
        title: "List users",
        description: "Logto users with emails and join dates.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listUsers(limit);
            if (rows.length === 0)
                return text("No users.");
            return text(rows.map((u, i) => `${i + 1}. [${u.id}] ${u.username ?? u.email ?? "(unnamed)"}${u.created ? ` (since ${u.created})` : ""}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_applications", {
        title: "List applications",
        description: "Logto applications (OIDC clients) with types.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listApplications(limit);
            if (rows.length === 0)
                return text("No applications.");
            return text(rows.map((a, i) => `${i + 1}. [${a.id}] ${a.name ?? "(unnamed)"}${a.type ? ` (${a.type})` : ""}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tenant_discovery", {
        title: "Read a tenant's OIDC config",
        description: "Fetch a Logto tenant's public OIDC discovery document: issuer, every endpoint, grants, PKCE methods, signing algorithms, client authentication methods, scopes and the claims Logto issues. Works on any tenant, cloud or self-hosted, with no API key.",
        inputSchema: z.object({
            url: z.string().optional().describe("Tenant base URL, e.g. https://abc123.logto.app. Default LOGTO_URL."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tenantDiscovery(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("signing_keys", {
        title: "List the signing keys",
        description: "List a Logto tenant's published JWKS signing keys with kid, algorithm, curve and the RFC 7638 thumbprint, so you can match a JWT header to the key that signed it and pin it.",
        inputSchema: z.object({
            url: z.string().optional().describe("Tenant base URL. Default LOGTO_URL."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await signingKeys(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("token_inspect", {
        title: "Inspect a token",
        description: "Decode a pasted JWT and check it: algorithm and kid, issuer, subject, audience, expiry and remaining lifetime, scopes including Logto's own, and the usual mistakes such as alg none, a missing aud, or an expired token. Decoding only, the signature is never verified.",
        inputSchema: z.object({
            token: z.string().describe("The full JWT as one string"),
            expected_issuer: z.string().optional().describe("Issuer you expect, to check it matches"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tokenInspect(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "logto-mcp";
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
    if (e instanceof LogtoError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
