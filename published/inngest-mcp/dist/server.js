import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { InngestError, listApps, sendEvent, sdkMatrix } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "inngest-mcp",
        version: "1.0.0",
    });
    server.registerTool("send_event", {
        title: "Send event",
        description: "Send an event to Inngest to trigger functions. Needs INNGEST_EVENT_KEY.",
        inputSchema: z.object({
            name: z.string().describe("Event name, e.g. 'app/user.signup'"),
            data: z.record(z.string(), z.unknown()).describe("Event payload as a JSON object"),
        }),
        annotations: WRITE,
    }, async ({ name, data }) => {
        try {
            return text(await sendEvent(name, data));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_apps", {
        title: "List apps",
        description: "Registered Inngest apps. Needs INNGEST_SIGNING_KEY.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listApps();
            if (rows.length === 0)
                return text("No apps.");
            return text(rows.map((a, i) => `${i + 1}. ${a.name ?? a.id ?? "?"}${a.url ? ` — ${a.url}` : ""}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sdk_matrix", {
        title: "SDK matrix",
        description: "What is actually published for an Inngest npm package: the latest version and its Node engine, how many versions exist and how many are prereleases, the full dist-tag landscape, the dependency counts, and last week's download count.",
        inputSchema: z.object({ package: z.string().describe("npm package name, default 'inngest'.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sdkMatrix(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("release_feed", {
        title: "Release feed",
        description: "The Inngest platform release train from GitHub: each release with its date, prerelease flag, asset downloads and release notes, the median gap between releases, and where the SDK on npm sits against the platform version.",
        inputSchema: z.object({ releases: z.number().describe("How many releases to show, 1-20.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement feed locally (paywall removed)
        try {
            return textError("Not yet implemented: feed");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("incident_history", {
        title: "Incident history",
        description: "The reliability record of the platform: current status per component from the status page, then the incident history with impact, time to resolution and the latest update on each.",
        inputSchema: z.object({ limit: z.number().describe("How many incidents to show, 1-25.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement history locally (paywall removed)
        try {
            return textError("Not yet implemented: history");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "inngest-mcp";
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
function errorMessage(e) {
    if (e instanceof InngestError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
