import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listApps, getApp, listNotifications, pushSdkPopularity, sdkReleaseTimeline, platformStatus } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "onesignal-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_apps", {
        title: "List apps",
        description: "OneSignal apps the key can send to.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listApps());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_app", {
        title: "Get app",
        description: "One app by id, with platform and player count.",
        inputSchema: z.object({
            app_id: z.string().describe("OneSignal app ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ app_id }) => {
        try {
            return text(await getApp(app_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_notifications", {
        title: "List notifications",
        description: "Recent notifications for an app.",
        inputSchema: z.object({
            app_id: z.string().describe("OneSignal app ID."),
            limit: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ app_id, limit }) => {
        try {
            return text(await listNotifications(app_id, limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("push_sdk_popularity", {
        title: "Push SDK popularity",
        description: "Which OneSignal SDK people actually install: for each of the Node, React Native and Cordova packages, the latest version, how many versions exist, and last week's npm download count with each one's share of the three.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (_args) => {
        try {
            return text(await pushSdkPopularity(_args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sdk_release_timeline", {
        title: "SDK release timeline",
        description: "The release train of one OneSignal SDK: first and latest publish dates, days since the last release, how many versions exist, the median gap between them, every dist-tag with any prerelease tags still on the board, and the recent versions by date.",
        inputSchema: z.object({
            package: z.string().describe("onesignal-node, react-native-onesignal or onesignal-cordova-plugin.").optional(),
            limit: z.number().describe("How many recent versions to list, 1-15.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sdkReleaseTimeline(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("platform_status", {
        title: "Platform status",
        description: "OneSignal's own reliability record: the headline status, every product area (push, email, SMS, in-app messages, integrations, analytics) with its current state, and the incident history with impact, time to resolve and the latest update on each.",
        inputSchema: z.object({ limit: z.number().describe("How many incidents to show, 1-15.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await platformStatus(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "onesignal-mcp";
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
