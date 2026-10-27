import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listInstalls, getInstall, listSites, platformStatus, currentIncidents, upcomingMaintenance } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "wpengine-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_installs", {
        title: "List installs",
        description: "All WP Engine installs with status, PHP version and domains.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listInstalls());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_install", {
        title: "Get install",
        description: "One WP Engine install with full details.",
        inputSchema: z.object({
            installId: z.string().describe("Install id"),
        }),
        annotations: READ_ONLY,
    }, async ({ installId }) => {
        try {
            return text(await getInstall(installId));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_sites", {
        title: "List sites",
        description: "WP Engine sites with install links.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listSites());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("platform_status", {
        title: "Platform status",
        description: "Live WP Engine platform status from the public status page: every service group, which services are degraded, and the overall counters. No account needed.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await platformStatus());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("current_incidents", {
        title: "Current incidents",
        description: "Incidents on the WP Engine status page with start/resolve times and the latest update text, newest last.",
        inputSchema: z.object({
            include_resolved: z.boolean().default(false).describe("Also list incidents that have been resolved"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await currentIncidents(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("upcoming_maintenance", {
        title: "Upcoming maintenance",
        description: "Maintenance windows WP Engine has scheduled, with the local page time and how long until each one starts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await upcomingMaintenance());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "wpengine-mcp";
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
