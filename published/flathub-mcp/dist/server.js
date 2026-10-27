import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { app, search, appTimeline } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "flathub-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search Flathub apps.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("app", {
        title: "App",
        description: "Details for one app.",
        inputSchema: z.object({ appId: z.string().describe("App ID like org.gimp.GIMP.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await app(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("catalogue_stats", {
        title: "Catalogue stats",
        description: "The Flathub catalogue in aggregate from Flathub own counters: apps published, how many carry a verified publisher, total downloads and the mean per app, how the catalogue splits across categories, which Flatpak runtime versions dominate, and where the downloads come from.",
        inputSchema: z.object({ limit: z.number().describe("Countries and categories to list, 1-30.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement stats locally (paywall removed)
        try {
            return textError("Not yet implemented: stats");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("app_trust", {
        title: "App trust",
        description: "Whether a Flathub app can be trusted with the machine: publisher verification, project licence and whether Flathub marks it free, end of life flag, payment requirement, app type, Flatpak runtime and SDK, launchable desktop id, and the content rating categories that came back above none.",
        inputSchema: z.object({ appId: z.string().describe("App ID like org.gimp.GIMP.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement trust locally (paywall removed)
        try {
            return textError("Not yet implemented: trust");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("app_timeline", {
        title: "App timeline",
        description: "When a Flathub app actually shipped: how many releases are listed, their types, the first and most recent release dates, the median gap between releases and how many carry an end of life date.",
        inputSchema: z.object({ appId: z.string().describe("App ID like org.gimp.GIMP."), limit: z.number().describe("Releases to list, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await appTimeline(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "flathub-mcp";
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
