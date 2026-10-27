import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { module, provider } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "terraform-registry-mcp", version: "1.0.0" });
    server.registerTool("provider", {
        title: "Provider",
        description: "Details for a Terraform provider.",
        inputSchema: z.object({ namespace: z.string().describe("Namespace like hashicorp."), name: z.string().describe("Provider name like aws.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await provider(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("module", {
        title: "Module",
        description: "Details for a Terraform module.",
        inputSchema: z.object({ namespace: z.string().describe("Namespace."), name: z.string().describe("Module name."), provider: z.string().describe("Provider like aws.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await module(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("provider_versions", {
        title: "Provider versions",
        description: "Every published version of a Terraform provider, newest first, with its plugin protocol versions and platform count.",
        inputSchema: z.object({ namespace: z.string().describe("Namespace like hashicorp."), name: z.string().describe("Provider name like aws."), limit: z.number().int().min(1).max(100).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement versions locally (paywall removed)
        try {
            return textError("Not yet implemented: versions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("module_versions", {
        title: "Module versions",
        description: "Every published version of a Terraform module, newest first, with required provider version, submodule count and deprecation note.",
        inputSchema: z.object({ namespace: z.string().describe("Namespace."), name: z.string().describe("Module name."), provider: z.string().describe("Provider like aws."), limit: z.number().int().min(1).max(100).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement versions locally (paywall removed)
        try {
            return textError("Not yet implemented: versions");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "terraform-registry-mcp";
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
