import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { domainStats, formatStats, listBounces, listDomains, MailgunError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "mailgun-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_domains", {
        title: "List domains",
        description: "Mailgun sending domains with state and creation date. Set MAILGUN_REGION=eu for EU accounts.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listDomains(limit);
            if (rows.length === 0)
                return text("No domains.");
            return text(rows.map((d, i) => `${i + 1}. ${d.name}${d.state ? ` (${d.state})` : ""}${d.created ? ` — since ${d.created}` : ""}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_stats", {
        title: "Domain stats",
        description: "Totals for a domain: sent, delivered, opened, failed.",
        inputSchema: z.object({
            domain: z.string().describe("Sending domain, e.g. 'mg.example.com'"),
        }),
        annotations: READ_ONLY,
    }, async ({ domain }) => {
        try {
            return text(formatStats(domain, await domainStats(domain)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_bounces", {
        title: "List bounces",
        description: "Bounced addresses for a domain with codes and errors.",
        inputSchema: z.object({
            domain: z.string().describe("Sending domain"),
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ domain, limit }) => {
        try {
            const rows = await listBounces(domain, limit);
            if (rows.length === 0)
                return text(`No bounces for ${domain}.`);
            return text(rows.map((b, i) => `${i + 1}. ${b}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dkim_selector_scan", {
        title: "DKIM selector scan",
        description: "Find out whether a sending domain publishes a DKIM key at all: probes the selector names providers actually use, over DNS-over-HTTPS, and reports key type, key size and any t= flags.",
        inputSchema: z.object({ domain: z.string().describe("Sending domain, e.g. acme.com"), selectors: z.string().describe("Extra selector names to probe, space separated.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement scan locally (paywall removed)
        try {
            return textError("Not yet implemented: scan");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mailgun_status_audit", {
        title: "Mailgun status audit",
        description: "Mailgun's public status page, component by component: what is not operational, any open incident with its latest update, and any maintenance that is scheduled.",
        inputSchema: z.object({ instance: z.string().describe("Unused, kept for a uniform signature.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement audit locally (paywall removed)
        try {
            return textError("Not yet implemented: audit");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mailgun-mcp";
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
    if (e instanceof MailgunError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
