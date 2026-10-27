import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_domain, m0_ip, m1_domainInfo } from "./api.js";
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'whois-mcp', version: '1.0.0' });
    server.registerTool("domain", {
        title: "Domain",
        description: "Registration record for a domain.",
        inputSchema: z.object({ domain: z.string().describe("Domain like example.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_domain(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ip", {
        title: "Ip",
        description: "Registration record for an IP address.",
        inputSchema: z.object({ ip: z.string().describe("IPv4 or IPv6 address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_ip(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_info", {
        title: "Domain info",
        description: "Get registration info for a domain.",
        inputSchema: z.object({ domain: z.string().describe("Domain like example.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_domainInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("asn_info", {
        title: "ASN info",
        description: "An autonomous system's RDAP registration: name, handle, registration and last-change dates, and the entities responsible, which the domain and ip tools never reach.",
        inputSchema: z.object({ asn: z.union([z.string(), z.number()]).describe("AS number, e.g. 15169 or AS15169."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement info locally (paywall removed)
        try {
            return textError("Not yet implemented: info");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("asn_networks", {
        title: "ASN networks",
        description: "Every CIDR range a registered autonomous system announces, read from its RDAP record, which shows the real footprint behind an AS number.",
        inputSchema: z.object({ asn: z.union([z.string(), z.number()]).describe("AS number."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement networks locally (paywall removed)
        try {
            return textError("Not yet implemented: networks");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_contacts", {
        title: "Domain contacts",
        description: "The public contact entities on a domain's RDAP record with roles, names, emails and phone numbers, which the domain summary view leaves out.",
        inputSchema: z.object({ domain: z.string().describe("Domain name, e.g. github.com."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement contacts locally (paywall removed)
        try {
            return textError("Not yet implemented: contacts");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "whois-mcp";
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
    return server;
}
