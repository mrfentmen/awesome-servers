import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DuolingoError, formatProfile, getProfile } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "duolingo-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_profile", {
        title: "Get profile",
        description: "A public Duolingo profile: streak, XP, courses, achievements.",
        inputSchema: z.object({
            username: z.string().describe("Duolingo username"),
        }),
        annotations: READ_ONLY,
    }, async ({ username }) => {
        try {
            return text(formatProfile(await getProfile(username)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("profile_details", {
        title: "Profile details",
        description: "The account side of a public Duolingo profile: join date, verified email, " +
            "Duolingo Plus, current course, interface and base language, motivation and roles.",
        inputSchema: z.object({
            username: z.string().describe("Duolingo username"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("course_catalog", {
        title: "Course catalog",
        description: "Duolingo's public course catalog with language pair, learner count and course phase.",
        inputSchema: z.object({ search: z.string().describe("Filter by language name or code.").optional(), limit: z.number().describe("Maximum courses, 1-50.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement catalog locally (paywall removed)
        try {
            return textError("Not yet implemented: catalog");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "duolingo-mcp";
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
function errorMessage(e) {
    if (e instanceof DuolingoError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
