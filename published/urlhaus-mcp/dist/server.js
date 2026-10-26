import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { recentUrls, lookupUrl, lookupPayload, searchTag, feedDigest, domainReputation } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "urlhaus-mcp",
        version: "1.0.0",
    });
    server.registerTool("recent_urls", {
        title: "Recent URLs",
        description: "Recently added malicious URLs.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 1000).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await recentUrls(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("lookup_url", {
        title: "Lookup URL",
        description: "Check one URL against URLhaus.",
        inputSchema: z.object({
            url: z.string().describe("Full URL, e.g. http://example.com/malware.bin")
        }),
        annotations: READ_ONLY,
    }, async ({ url }) => {
        try {
            return text(await lookupUrl(url));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("lookup_payload", {
        title: "Lookup payload",
        description: "Malware payload details for one SHA256 hash.",
        inputSchema: z.object({
            sha256: z.string().describe("SHA256 hash.")
        }),
        annotations: READ_ONLY,
    }, async ({ sha256 }) => {
        try {
            return text(await lookupPayload(sha256));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_tag", {
        title: "Search tag",
        description: "Malicious URLs carrying a malware tag, e.g. emotet.",
        inputSchema: z.object({
            tag: z.string().describe("Tag, e.g. emotet."),
            limit: z.string().describe("Max results.").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ tag, limit }) => {
        try {
            return text(await searchTag(tag, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("feed_digest", {
        title: "Feed digest",
        description: "Reads abuse.ch's public recent-URLs dump as a whole: row count and date window, the payload types and URL statuses broken down, the most frequent hosts, tags and reporters, and the newest entries. Needs no Auth-Key.",
        inputSchema: z.object({
            limit: z.number().describe("Rows per breakdown, 1-40. Defaults to 12.").optional(),
            threat: z.string().describe("Optional threat filter, e.g. malware_download, exe_url.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await feedDigest(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_reputation", {
        title: "Domain reputation",
        description: "A domain's standing on abuse.ch's public DNS blocklist, queried the way a mail server would and decoded into a reason: spam domain, phishing, malware, botnet C2, and the rest of the published return codes. No Auth-Key and no API call.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to look up, e.g. example.com"),
            checkMx: z.boolean().describe("Unused; accepted so the schema matches the other lookup tools.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await domainReputation(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "urlhaus-mcp";
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
