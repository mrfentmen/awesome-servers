import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { blockingStatus, PiholeError, setBlocking, summaryStats, communitySearch } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "pihole-mcp",
        version: "1.0.0",
    });
    server.registerTool("status", {
        title: "Blocking status",
        description: "Whether Pi-hole blocking is on, plus 24h query/blocked stats.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(`${await blockingStatus()}\n\n${await summaryStats()}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("set_blocking", {
        title: "Toggle blocking",
        description: "Enable or disable Pi-hole blocking, optionally for N seconds.",
        inputSchema: z.object({
            enabled: z.boolean().describe("true = block ads, false = allow all"),
            seconds: z.number().int().min(0).default(0).describe("Auto re-enable after N seconds (0 = stay)"),
        }),
        annotations: WRITE,
    }, async ({ enabled, seconds }) => {
        try {
            return text(await setBlocking(enabled, seconds));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("community_search", {
        title: "Search the Pi-hole community",
        description: "Search the official Pi-hole community forum for a thread about a problem you are seeing. Returns thread ids, post counts, tags and a snippet of the matching post.",
        inputSchema: z.object({
            query: z.string().describe("Error message or symptom, e.g. 'DNSSEC not working'"),
            limit: z.number().int().min(1).max(10).default(5),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await communitySearch(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("blocklist_audit", {
        title: "Audit a blocklist",
        description: "Audit a pasted blocklist locally: syntax breakdown, TLD spread, duplicate rules, invalid regular expressions, punycode and stray IP entries, hosts-file addresses, and rules a broader rule already covers.",
        inputSchema: z.object({
            rules: z.string().describe("The blocklist, one rule per line, in adblock, hosts or plain-domain form"),
            name: z.string().optional().describe("Which list this is, e.g. 'StevenBlack'"),
        }),
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
    server.registerTool("rule_match_test", {
        title: "Test which rules match",
        description: "Check which domains in a pasted blocklist would actually block a set of test domains, using Pi-hole's own matching rules (||domain^ covers subdomains, @@ is an exception, /regex/ is applied first). Local, no Pi-hole needed.",
        inputSchema: z.object({
            rules: z.string().describe("The rules to test, one per line"),
            domains: z.string().describe("Domains to test, separated by spaces, commas or newlines"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement test locally (paywall removed)
        try {
            return textError("Not yet implemented: test");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "pihole-mcp";
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
    if (e instanceof PiholeError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
