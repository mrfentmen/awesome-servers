import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { inspectUrl } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "http-inspector-mcp", version: "1.0.0" });
    server.registerTool("inspect_url", {
        title: "Inspect url",
        description: "Fetch a URL and report status and headers.",
        inputSchema: z.object({ url: z.string().describe("The URL to inspect.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await inspectUrl(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dns_records", {
        title: "Dns records",
        description: "Look up A, AAAA, MX, NS, TXT, CNAME, CAA or SOA records for a host using Cloudflare DNS over HTTPS.",
        inputSchema: z.object({ host: z.string().describe("Hostname or URL, for example github.com."), types: z.string().describe("Comma separated record types. Defaults to A,AAAA,MX,NS.").optional() }),
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
    server.registerTool("redirect_chain", {
        title: "Redirect chain",
        description: "Follow a URL one redirect at a time and report each hop: status code, elapsed milliseconds and the next location.",
        inputSchema: z.object({ url: z.string().describe("The URL to trace."), max_hops: z.number().describe("Max hops, 1-20, default 8.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement chain locally (paywall removed)
        try {
            return textError("Not yet implemented: chain");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("security_txt", {
        title: "Security txt",
        description: "Fetch a site's /.well-known/security.txt and report its contact, policy, expiry and other fields.",
        inputSchema: z.object({ host: z.string().describe("Hostname or URL, for example anthropic.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement txt locally (paywall removed)
        try {
            return textError("Not yet implemented: txt");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "http-inspector-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
