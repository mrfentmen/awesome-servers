import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createContact, findContact, formatContact, LoopsError, sendEvent, sendingDomainDns, campaignLinkAudit } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "loops-mcp",
        version: "1.0.0",
    });
    server.registerTool("find_contact", {
        title: "Find contact",
        description: "Find a Loops contact by email.",
        inputSchema: z.object({
            email: z.string().describe("Email address"),
        }),
        annotations: READ_ONLY,
    }, async ({ email }) => {
        try {
            const c = await findContact(email);
            if (!c)
                return text(`No Loops contact ${email}.`);
            return text(formatContact(c));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_contact", {
        title: "Create contact",
        description: "Create a Loops contact with optional first/last name.",
        inputSchema: z.object({
            email: z.string().describe("Email address"),
            first_name: z.string().default(""),
            last_name: z.string().default(""),
        }),
        annotations: WRITE,
    }, async ({ email, first_name, last_name }) => {
        try {
            return text(await createContact(email, first_name, last_name));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("send_event", {
        title: "Send event",
        description: "Send a Loops event to trigger email flows.",
        inputSchema: z.object({
            email: z.string().describe("Contact email"),
            event_name: z.string().describe("Event name, e.g. 'signup'"),
            properties: z.record(z.string(), z.unknown()).default({}).describe("Event properties object"),
        }),
        annotations: WRITE,
    }, async ({ email, event_name, properties }) => {
        try {
            return text(await sendEvent(email, event_name, properties));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sending_domain_dns", {
        title: "Sending domain DNS",
        description: "What a sending domain publishes about its own mail: MX targets, the SPF record and its DNS-lookup count, and the DMARC policy with subdomain policy and pct. No Loops key needed.",
        inputSchema: z.object({ domain: z.string().describe("Sending domain, e.g. acme.com") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sendingDomainDns(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("campaign_link_audit", {
        title: "Campaign link audit",
        description: "Check the links pasted out of a campaign are actually reachable: HTTP status, whether the final page is https, and where a redirect chain lands.",
        inputSchema: z.object({ links: z.string().describe("Links from the campaign, separated by spaces or commas."), limit: z.number().int().min(1).max(25).default(10).describe("How many links to check (default 10, max 25).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await campaignLinkAudit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "loops-mcp";
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
    if (e instanceof LoopsError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
