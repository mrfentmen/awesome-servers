import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { contentCheck, endpointSummary, errorMessage, headersReport, latencyBreakdown, redirectChain, responseTimes, certificateInfo, dnsRecords, portCheck, tlsVersions, hostNetwork } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({ name: "betterstack-mcp", version: "1.0.0" });
    server.registerTool("response_times", {
        title: "Response times",
        description: "Sample a URL several times and report min, median, average, max and jitter, so you can tell steady from flaky.",
        inputSchema: z.object({
            url: z.string().describe("URL to sample, for example https://example.com."),
            samples: z.number().describe("Requests to make, 2-10. Defaults to 3.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await responseTimes(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("latency_breakdown", {
        title: "Latency breakdown",
        description: "Split one request into DNS, TCP connect, TLS handshake and time-to-headers, and say which stage is slowest.",
        inputSchema: z.object({
            url: z.string().describe("URL to measure, for example https://example.com.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await latencyBreakdown(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("content_check", {
        title: "Content check",
        description: "Audit a page's title, meta description, canonical, lang, viewport, headings, image alt text and word count.",
        inputSchema: z.object({
            url: z.string().describe("Page to inspect, for example https://example.com.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await contentCheck(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("redirect_chain", {
        title: "Redirect chain",
        description: "Every hop from the URL you give to the URL that finally answers, with timing and loop detection.",
        inputSchema: z.object({
            url: z.string().describe("URL to trace, for example http://example.com.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await redirectChain(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("headers_report", {
        title: "Header report",
        description: "Grouped response headers — origin, caching and CDN, compression, security and cookies — with what looks wrong.",
        inputSchema: z.object({
            url: z.string().describe("URL to read the headers from, for example https://example.com.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await headersReport(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("endpoint_summary", {
        title: "Endpoint summary",
        description: "One call for a whole endpoint: reachable or not, latency stages, TLS certificate age and DNS address.",
        inputSchema: z.object({
            url: z.string().describe("Endpoint to summarise, for example https://example.com.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await endpointSummary(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("certificate_info", {
        title: "Certificate info",
        description: "Read the TLS certificate a host presents: subject, issuer, validity and days left, chain length, SAN list and whether Node trusts it.",
        inputSchema: z.object({
            url: z.string().describe("Host or URL to read the certificate from, for example https://example.com.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await certificateInfo(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("dns_records", {
        title: "DNS records",
        description: "Look up a domain's A, AAAA, CNAME, MX, TXT, NS and CAA records at once and report its SPF and DMARC status.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to inspect, for example example.com.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dnsRecords(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("port_check", {
        title: "Port check",
        description: "Test whether TCP ports accept a connection, with the time each port took and the reason a port is closed.",
        inputSchema: z.object({
            host: z.string().describe("Host or URL to test, for example example.com."),
            ports: z.string().describe('Ports to test, comma separated, max 10. Defaults to "80,443".').optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await portCheck(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("tls_versions", {
        title: "TLS versions",
        description: "Check whether a host still negotiates TLS 1.2 and TLS 1.3, and which protocol and cipher it picks for each.",
        inputSchema: z.object({
            host: z.string().describe("Host or URL to test, for example example.com."),
            port: z.number().describe("TCP port, defaults to 443.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tlsVersions(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("domain_registration", {
        title: "Domain registration",
        description: "RDAP registration record for a domain: registrar, creation and expiry dates, registry locks, DNSSEC and nameservers.",
        inputSchema: z.object({
            domain: z.string().describe("Domain name, e.g. example.com"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: domain_registration ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_betterstack_domain_registration", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("host_network", {
        title: "Host network profile",
        description: "Where a host is served from: IP, autonomous system, operator, reverse DNS and city/country.",
        inputSchema: z.object({
            host: z.string().describe("Hostname or URL to place on the network"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hostNetwork(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("crawl_rules", {
        title: "Crawl rules",
        description: "robots.txt directives that apply to a generic crawler, plus the sitemaps the site declares.",
        inputSchema: z.object({
            url: z.string().describe("Site to read crawl rules from, e.g. https://example.com"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: crawl_rules ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_betterstack_crawl_rules", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
