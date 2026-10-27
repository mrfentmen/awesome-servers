import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cert } from "./local.js";
import { check, maintenanceWindows } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "uptime-mcp", version: "1.0.0" });
    server.registerTool("check", {
        title: "Check",
        description: "HTTP status and latency for a URL.",
        inputSchema: z.object({ url: z.string().describe("URL like https://example.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await check(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cert", {
        title: "Cert",
        description: "TLS certificate expiry for a host.",
        inputSchema: z.object({ host: z.string().describe("Hostname like example.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await cert(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dns_records", {
        title: "DNS records",
        description: "Resolve a hostname's DNS records through Google DNS-over-HTTPS: A, AAAA, MX, TXT, NS, SOA, CNAME, PTR, SRV or CAA.",
        inputSchema: z.object({ host: z.string().describe("Hostname like example.com."), type: z.string().describe("Record type like A, MX, TXT, CAA.").optional() }),
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
    server.registerTool("service_status", {
        title: "Service status",
        description: "Live status page summary for a major service: overall indicator, components that are not operational and open incidents.",
        inputSchema: z.object({ service: z.string().describe("github, cloudflare or reddit.").optional(), limit: z.number().int().min(1).max(40).default(10).describe("Max components or incidents listed.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement status locally (paywall removed)
        try {
            return textError("Not yet implemented: status");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("incident_history", {
        title: "Incident history",
        description: "Recent GitHub incidents, including resolved outages, timestamps and the latest published update.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(20).optional().describe("Maximum events, defaults to 5.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement history locally (paywall removed)
        try {
            return textError("Not yet implemented: history");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("maintenance_windows", {
        title: "Maintenance windows",
        description: "Published GitHub maintenance windows with start and end times, state and latest update; includes completed work.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(20).optional().describe("Maximum events, defaults to 5.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await maintenanceWindows(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "uptime-mcp";
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
