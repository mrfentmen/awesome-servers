import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOverview, listUsers, getJourneys, domainProfile, trackingAudit } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "rybbit-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_overview", {
        title: "Get site overview",
        description: "Rybbit sessions, pageviews, users, bounce rate for a site and period.",
        inputSchema: z.object({
            site: z.string().describe("Site ID from Rybbit, e.g. 1"),
            startDate: z.string().describe("Start YYYY-MM-DD"),
            endDate: z.string().describe("End YYYY-MM-DD"),
            timeZone: z.string().default("UTC").describe("IANA timezone"),
        }),
        annotations: READ_ONLY,
    }, async ({ site, startDate, endDate, timeZone }) => {
        try {
            return text(await getOverview(site, startDate, endDate, timeZone));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_users", {
        title: "List users",
        description: "Rybbit users for a site with pagination.",
        inputSchema: z.object({
            site: z.string().describe("Site ID from Rybbit, e.g. 1"),
            startDate: z.string().describe("Start date, e.g. 2026-09-01"),
            endDate: z.string().describe("End date, e.g. 2026-09-30"),
            timeZone: z.string().default("UTC").describe("IANA timezone, e.g. Europe/Berlin"),
            limit: z.number().default(20).describe("Max rows to return, e.g. 20"),
        }),
        annotations: READ_ONLY,
    }, async ({ site, startDate, endDate, timeZone, limit }) => {
        try {
            return text(await listUsers(site, startDate, endDate, timeZone, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_journeys", {
        title: "Get journeys",
        description: "Common Rybbit navigation paths (journeys) through a site.",
        inputSchema: z.object({
            site: z.string().describe("Site ID from Rybbit, e.g. 1"),
            startDate: z.string().describe("Start date, e.g. 2026-09-01"),
            endDate: z.string().describe("End date, e.g. 2026-09-30"),
            timeZone: z.string().default("UTC").describe("IANA timezone, e.g. Europe/Berlin"),
        }),
        annotations: READ_ONLY,
    }, async ({ site, startDate, endDate, timeZone }) => {
        try {
            return text(await getJourneys(site, startDate, endDate, timeZone));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_profile", {
        title: "Domain registry profile",
        description: "The registry record behind a domain the analytics is attributed to: registrar, registrant, registration and expiry dates, DNSSEC, transfer locks and name servers, with anything that qualifies the traffic history.",
        inputSchema: z.object({
            domain: z.string().describe("Domain name, e.g. 'example.com'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await domainProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tracking_audit", {
        title: "Tracking tag audit",
        description: "Which measurement tags a page actually loads, read from the live HTML: the analytics vendors referenced, the specific GA4, GTM, Meta, Hotjar and Plausible identifiers, the framework, and whether the page is counted more than once.",
        inputSchema: z.object({
            url: z.string().describe("Page to audit, e.g. 'https://example.com'"),
            limit: z.number().describe("Max entries per list, 1-25. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await trackingAudit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "rybbit-mcp";
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
