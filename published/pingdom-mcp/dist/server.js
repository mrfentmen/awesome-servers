import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { brokenLinks, certificateExpiry, checkRedirects, checkUrl, performanceReport, responseTimes } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "pingdom-mcp",
        version: "2.0.0",
    });
    server.registerTool("check_url", {
        title: "Check URL up or down",
        description: "Test whether a URL is up right now and report its HTTP status, response time and redirect count. No API key needed.",
        inputSchema: z.object({
            url: z.string().describe("URL or hostname to test, for example https://example.com."),
        }),
        annotations: READ_ONLY,
    }, async ({ url }) => {
        try {
            return text(await checkUrl({ url }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("response_times", {
        title: "Response time samples",
        description: "Request a URL several times in a row and report min, median, average, max and jitter, so you can tell whether a site is consistently fast or flaky.",
        inputSchema: z.object({
            url: z.string().describe("URL to time, for example https://example.com."),
            samples: z.number().describe("How many requests to make, 2 to 10. Defaults to 3.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ url, samples }) => {
        try {
            return text(await responseTimes({ url, samples }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("check_redirects", {
        title: "Check redirect chain",
        description: "Follow every redirect for a URL and flag loops, plain-HTTP starts and hops that could be collapsed into one rule.",
        inputSchema: z.object({
            url: z.string().describe("URL to follow, for example http://example.com."),
        }),
        annotations: READ_ONLY,
    }, async ({ url }) => {
        try {
            return text(await checkRedirects({ url }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("certificate_expiry", {
        title: "Certificate expiry",
        description: "Check when a host's TLS certificate expires and whether the chain is trusted, with a CRITICAL/WARNING/OK status.",
        inputSchema: z.object({
            host: z.string().describe("Hostname to inspect, for example example.com."),
        }),
        annotations: READ_ONLY,
    }, async ({ host }) => {
        try {
            return text(await certificateExpiry({ host }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("broken_links", {
        title: "Find broken links",
        description: "Scan a page for links, request each one and list the ones that return an error status. Great for catching dead links before visitors do.",
        inputSchema: z.object({
            url: z.string().describe("Page to scan, for example https://example.com."),
            limit: z.number().describe("Maximum links to test, 1 to 40. Defaults to 15.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ url, limit }) => {
        try {
            return text(await brokenLinks({ url, limit }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("performance_report", {
        title: "Performance report",
        description: "Break a page load into DNS lookup, connect, TLS, time-to-first-byte and total time, then report payload size, compression, caching and page weight with a list of fixes.",
        inputSchema: z.object({
            url: z.string().describe("URL to profile, for example https://example.com."),
        }),
        annotations: READ_ONLY,
    }, async ({ url }) => {
        try {
            return text(await performanceReport({ url }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("security_headers", {
        title: "Security headers",
        description: "The response security headers a site sends (HSTS, CSP, frame options, referrer and permissions policy) and what is missing or too weak.",
        inputSchema: z.object({
            url: z.string().describe("URL or hostname to check, e.g. https://example.com"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement headers locally (paywall removed)
        try {
            return textError("Not yet implemented: headers");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dns_records", {
        title: "DNS records",
        description: "The DNS records behind a hostname: A/AAAA addresses, CNAME, MX mail exchangers, NS, SOA, TXT and CAA, with what is missing called out.",
        inputSchema: z.object({
            host: z.string().describe("Hostname to look up, e.g. github.com"),
            type: z.string().describe("One record type, or ALL for every type. Defaults to ALL.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement records locally (paywall removed)
        try {
            return textError("Not yet implemented: records");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "pingdom-mcp";
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
    return server;
}
