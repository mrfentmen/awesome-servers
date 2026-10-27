import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { avatar, gravatarProfile } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ui-avatars-mcp", version: "1.0.0" });
    server.registerTool("avatar", {
        title: "Avatar",
        description: "Avatar URL for a name.",
        inputSchema: z.object({ name: z.string().describe("Name or initials."), size: z.number().describe("Pixel size.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await avatar(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("gravatar", {
        title: "Gravatar URL",
        description: "Gravatar image URL for an email address. The URL is a pure local MD5 of the trimmed lowercase address, so no request is made.",
        inputSchema: z.object({ email: z.string().describe("Email address."), size: z.number().int().min(16).max(2048).default(200), default: z.string().describe("Fallback: 404, mp, identicon, retro, robohash, blank.").default("identicon"), rating: z.string().describe("g, pg, r or x.").default("g"), format: z.string().describe("jpg, png or gif.").default("png") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement gravatar locally (paywall removed)
        try {
            return textError("Not yet implemented: gravatar");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("gravatar_profile", {
        title: "Gravatar profile",
        description: "The public Gravatar profile registered for an email address: display name, username, location and profile URL.",
        inputSchema: z.object({ email: z.string().describe("Email address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await gravatarProfile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ui-avatars-mcp";
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
