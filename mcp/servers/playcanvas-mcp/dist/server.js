import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listProjectAssets, getAsset, getRateLimits } from "./api.js";
import { premiumTool } from "./gateway.js";
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
        // ---- paywall: engine_release_channels ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_playcanvas_engine_release_channels", args));
        }
        catch (e) {
            return textError(errorMessage(e));
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
        // ---- paywall: engine_release_notes ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_playcanvas_engine_release_notes", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
