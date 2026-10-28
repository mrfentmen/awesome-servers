import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { emailDeliverability, resolveHost, reverseLookup, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "dns-mcp", version: "1.0.0" });
    server.tool("resolve_host", "Resolve a hostname to A, AAAA, MX, TXT, NS, CNAME, SOA, CAA or SRV records.", {
        name: z.string().describe('Hostname to look up'), type: z.enum(['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA', 'CAA', 'SRV']).optional().describe('Record type, default A')
    }, async (a) => {
        try {
            return text(await resolveHost(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("reverse_lookup", "PTR lookup: the hostname(s) behind an IP address.", {
        ip: z.string().describe('IPv4 or IPv6 address')
    }, async (a) => {
        try {
            return text(await reverseLookup(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("email_deliverability", "Check whether a domain can receive email: MX records, null MX, SPF and DMARC.", {
        domain: z.string().describe('Domain, e.g. example.com')
    }, async (a) => {
        try {
            return text(await emailDeliverability(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
