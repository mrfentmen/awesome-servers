import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { email, ipBreaches } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "hudsonrock-mcp", version: "1.0.0" });
    server.registerTool("email", {
        title: "Email",
        description: "Check if an email appeared in infostealer breaches.",
        inputSchema: z.object({ email: z.string().describe("Email address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await email(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_exposure", {
        title: "Domain exposure",
        description: "Infostealer exposure summary for a company domain: infected machines, exposed employees, users and third parties, infostealer families and most exposed applications.",
        inputSchema: z.object({ domain: z.string().describe("Domain like tesla.com."), apps: z.number().describe("Max items in the family and application lists.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement exposure locally (paywall removed)
        try {
            return textError("Not yet implemented: exposure");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ip_breaches", {
        title: "IP breaches",
        description: "Infostealer breach records tied to an IP address, with machine name, OS and antivirus seen at compromise time.",
        inputSchema: z.object({ ip: z.string().describe("IP address."), limit: z.number().describe("Max records.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ipBreaches(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "hudsonrock-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
