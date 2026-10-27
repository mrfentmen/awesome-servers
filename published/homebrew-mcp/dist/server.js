import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formula } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "homebrew-mcp", version: "1.0.0" });
    server.registerTool("formula", {
        title: "Formula",
        description: "Details for one Homebrew formula.",
        inputSchema: z.object({ name: z.string().describe("Formula name like git.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await formula(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cask", {
        title: "Cask",
        description: "Details for one Homebrew cask: version, apps and binaries it installs, macOS requirement, conflicts and caveats.",
        inputSchema: z.object({ name: z.string().describe("Cask token like firefox or visual-studio-code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement cask locally (paywall removed)
        try {
            return textError("Not yet implemented: cask");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("formula_bottles", {
        title: "Formula bottles",
        description: "Which prebuilt Homebrew bottles exist for a formula (per platform, with sha256 and cellar path), plus its build and test dependencies.",
        inputSchema: z.object({ name: z.string().describe("Formula name like git.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement bottles locally (paywall removed)
        try {
            return textError("Not yet implemented: bottles");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "homebrew-mcp";
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
