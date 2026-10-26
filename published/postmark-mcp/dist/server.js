import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getServer, listTemplates, listOutbound, blacklistCheck, mailPolicyReport } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "postmark-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_server", {
        title: "Server info",
        description: "Postmark server details and delivery settings.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getServer());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_templates", {
        title: "List templates",
        description: "Email templates on the server, with ids.",
        inputSchema: z.object({
            count: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ count }) => {
        try {
            return text(await listTemplates(count));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_outbound", {
        title: "Outbound messages",
        description: "Recent outbound messages with recipient and status.",
        inputSchema: z.object({
            count: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ count }) => {
        try {
            return text(await listOutbound(count));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("blacklist_check", {
        title: "Sending IP blocklist check",
        description: "Whether the mail servers a domain sends from appear on any public DNS blocklist (Spamhaus ZEN, SpamCop, Barracuda, SORBS), with the PTR name of each address.",
        inputSchema: z.object({
            email: z.string().describe("Sending address or domain, e.g. 'bounce@shop.example.com' or 'example.com'"),
            limit: z.number().describe("Max addresses to query, 1-40. Defaults to 12.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await blacklistCheck(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mail_policy_report", {
        title: "Mail transport policy",
        description: "Whether a sending domain publishes MTA-STS (and in what mode), a BIMI record for brand display, and a TLS-RPT record for failed handshakes, with the policy's authorised MX hosts.",
        inputSchema: z.object({
            domain: z.string().describe("Sending domain, e.g. 'google.com'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await mailPolicyReport(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "postmark-mcp";
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
