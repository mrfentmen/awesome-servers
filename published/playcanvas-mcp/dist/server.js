import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listProjectAssets, getAsset, getRateLimits, engineReleaseChannels, engineReleaseNotes } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "playcanvas-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_project_assets", {
        title: "List project assets",
        description: "Assets in a PlayCanvas project branch.",
        inputSchema: z.object({
            project_id: z.string().describe("Numeric project ID."),
            branch_id: z.string().describe("Branch ID from version control panel."),
            limit: z.string().describe("Max items (default 16).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ project_id, branch_id, limit }) => {
        try {
            return text(await listProjectAssets(project_id, branch_id, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_asset", {
        title: "Get asset",
        description: "Single PlayCanvas asset metadata.",
        inputSchema: z.object({
            asset_id: z.string().describe("Numeric asset ID."),
            branch_id: z.string().describe("PlayCanvas branch ID, e.g. 12345")
        }),
        annotations: READ_ONLY,
    }, async ({ asset_id, branch_id }) => {
        try {
            return text(await getAsset(asset_id, branch_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_rate_limits", {
        title: "Rate limits",
        description: "Current PlayCanvas REST API rate limits.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getRateLimits());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("engine_release_channels", {
        title: "Engine release channels",
        description: "What the PlayCanvas engine's npm dist-tags point at right now (latest, lts, beta, preview), how old each is, and how fast stable versions ship.",
        inputSchema: z.object({
            include_prerelease: z.boolean().describe("Set false to skip a note about the alpha and beta trains.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await engineReleaseChannels(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("engine_release_notes", {
        title: "Engine release notes",
        description: "The published PlayCanvas engine release notes, read from the GitHub release bodies, so a changelog can be checked without a browser.",
        inputSchema: z.object({
            limit: z.number().describe("Max releases, 1-15. Defaults to 6.").optional(),
            include_prerelease: z.boolean().describe("Include alpha and beta releases. Defaults to true.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await engineReleaseNotes(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "playcanvas-mcp";
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
    return server;
}
