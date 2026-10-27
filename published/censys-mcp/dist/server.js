import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getHost, searchHosts, hostAggregate, searchCertificates, certificateExposure } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "censys-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_host", {
        title: "Host lookup",
        description: "Censys record for an IP: services, ports and certificates.",
        inputSchema: z.object({
            ip: z.string().describe("IPv4/IPv6 address.")
        }),
        annotations: READ_ONLY,
    }, async ({ ip }) => {
        try {
            return text(await getHost(ip));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_hosts", {
        title: "Search hosts",
        description: "Search hosts with Censys query syntax, e.g. services.http.",
        inputSchema: z.object({
            query: z.string().describe("e.g. services.service_name: HTTP."),
            per_page: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, per_page }) => {
        try {
            return text(await searchHosts(query, per_page));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("host_aggregate", {
        title: "Host aggregate",
        description: "Bucket any Censys host field across every host matching a query - top ports on HTTP, ASNs in a country, software in use - with total, omitted hosts and deviation.",
        inputSchema: z.object({
            field: z.string().describe("Censys field path, e.g. services.port or autonomous_system.asn"),
            query: z.string().describe("Censys query, e.g. services.service_name: HTTP"),
            buckets: z.number().int().min(1).max(50).default(10),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hostAggregate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_certificates", {
        title: "Search certificates",
        description: "Search the Censys certificate index: subject, issuer, signature algorithm, validity window and days remaining, SAN names, JA3/JA4 and NSS validation status.",
        inputSchema: z.object({
            query: z.string().describe("Censys certificate query, e.g. names: example.com"),
            limit: z.number().int().min(1).max(50).default(10),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchCertificates(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("certificate_exposure", {
        title: "Certificate exposure",
        description: "The exposure surface behind one certificate: its subject, issuer, validity and names, then every Censys host presenting it with the services and ports it appears on.",
        inputSchema: z.object({
            fingerprint: z.string().describe("SHA-256 certificate fingerprint, 64 hex characters, colons allowed"),
            limit: z.number().int().min(1).max(100).default(20),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await certificateExposure(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "censys-mcp";
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
