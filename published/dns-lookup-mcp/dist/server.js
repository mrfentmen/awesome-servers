import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookup, lookupAll, cnameChain } from "./api.js";
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
            return textError(String(e));
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
            return textError(String(e));
        }
    });
    server.registerTool("reverse_lookup", {
        title: "Reverse lookup",
        description: "The PTR names an IPv4 address resolves back to. The address is turned into the in-addr.arpa form the resolver needs, and the client-side check rejects anything that is not an IPv4 address.",
        inputSchema: z.object({ ip: z.string().describe("IPv4 address, like 8.8.8.8.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement lookup locally (paywall removed)
        try {
            return textError("Not yet implemented: lookup");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dnssec_check", {
        title: "DNSSEC check",
        description: "Whether a name's answer could be DNSSEC validated, from the resolver's own AD flag, its status and the RRSIG records it returned.",
        inputSchema: z.object({ domain: z.string().describe("Domain name."), type: z.string().describe("Record type like A or MX. Defaults to A.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement check locally (paywall removed)
        try {
            return textError("Not yet implemented: check");
        }
        catch (e) {
            return textError(String(e));
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
            return textError(String(e));
        }
    });
    const serverName = "dns-lookup-mcp";
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
