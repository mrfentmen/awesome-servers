import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { issuances, transparencyLog } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "certspotter-mcp", version: "1.0.0" });
    server.registerTool("issuances", {
        title: "Issuances",
        description: "Certificate issuances for a domain.",
        inputSchema: z.object({ domain: z.string().describe("Domain name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await issuances(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("subdomain_certificates", {
        title: "Subdomain certificates",
        description: "Certificates that cover a domain or any of its subdomains, listing every host name seen.",
        inputSchema: z.object({ domain: z.string().describe("Domain name."), limit: z.number().describe("Max certificates.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement certificates locally (paywall removed)
        try {
            return textError("Not yet implemented: certificates");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("issuance_issuers", {
        title: "Issuance issuers",
        description: "Which certificate authorities issued a domain's certificates, with validity windows and revocation.",
        inputSchema: z.object({ domain: z.string().describe("Domain name."), limit: z.number().describe("Max certificates.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement issuers locally (paywall removed)
        try {
            return textError("Not yet implemented: issuers");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("transparency_log", {
        title: "Transparency log",
        description: "Unexpired certificate transparency log entries for a domain, straight from crt.sh.",
        inputSchema: z.object({ domain: z.string().describe("Domain name."), limit: z.number().describe("Max entries.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await transparencyLog(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "certspotter-mcp";
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
