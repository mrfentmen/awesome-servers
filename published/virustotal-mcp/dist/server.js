import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { domainReport, fileReport, formatVerdict, ipReport, urlReport, VirusTotalError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "virustotal-mcp",
        version: "1.0.0",
    });
    server.registerTool("file_report", {
        title: "File report",
        description: "Engine verdicts for a file hash (MD5/SHA1/SHA256).",
        inputSchema: z.object({
            hash: z.string().describe("File hash"),
        }),
        annotations: READ_ONLY,
    }, async ({ hash }) => {
        try {
            return text(formatVerdict(await fileReport(hash)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("url_report", {
        title: "URL report",
        description: "Engine verdicts for a URL.",
        inputSchema: z.object({
            url: z.string().describe("Full URL with https://"),
        }),
        annotations: READ_ONLY,
    }, async ({ url }) => {
        try {
            return text(formatVerdict(await urlReport(url)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_report", {
        title: "Domain report",
        description: "Engine verdicts and reputation for a domain.",
        inputSchema: z.object({
            domain: z.string().describe("Domain, e.g. 'example.com'"),
        }),
        annotations: READ_ONLY,
    }, async ({ domain }) => {
        try {
            return text(formatVerdict(await domainReport(domain)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ip_report", {
        title: "IP report",
        description: "Engine verdicts and reputation for an IP address.",
        inputSchema: z.object({
            ip: z.string().describe("IPv4 or IPv6 address"),
        }),
        annotations: READ_ONLY,
    }, async ({ ip }) => {
        try {
            return text(formatVerdict(await ipReport(ip)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "virustotal-mcp";
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
function errorMessage(e) {
    if (e instanceof VirusTotalError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
