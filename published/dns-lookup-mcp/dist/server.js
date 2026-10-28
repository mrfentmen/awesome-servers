import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookup, lookupAll, cnameChain } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "dns-lookup-mcp", version: "1.0.0" });
    server.registerTool("lookup", {
        title: "Lookup",
        description: "Look up DNS records for a domain.",
        inputSchema: z.object({ domain: z.string().describe("Domain name."), type: z.string().describe("Record type like A or MX.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lookup(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("lookup_all", {
        title: "Lookup all",
        description: "Look up common DNS record types for a domain.",
        inputSchema: z.object({ domain: z.string().describe("Domain name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lookupAll(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("reverse_lookup", {
        title: "Reverse lookup",
        description: "The PTR names an IPv4 address resolves back to. The address is turned into the in-addr.arpa form the resolver needs, and the client-side check rejects anything that is not an IPv4 address.",
        inputSchema: z.object({ ip: z.string().describe("IPv4 address, like 8.8.8.8.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: reverse_lookup ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_dns_lookup_reverse_lookup", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("dnssec_check", {
        title: "DNSSEC check",
        description: "Whether a name's answer could be DNSSEC validated, from the resolver's own AD flag, its status and the RRSIG records it returned.",
        inputSchema: z.object({ domain: z.string().describe("Domain name."), type: z.string().describe("Record type like A or MX. Defaults to A.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: dnssec_check ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_dns_lookup_dnssec_check", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("cname_chain", {
        title: "CNAME chain",
        description: "Every CNAME hop a name resolves through before its final address, which a plain A lookup hides.",
        inputSchema: z.object({ domain: z.string().describe("Domain name, like www.github.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await cnameChain(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
