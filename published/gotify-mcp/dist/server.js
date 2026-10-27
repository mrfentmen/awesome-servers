import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sendMessage, listMessages, listApps, alertPayload, retrySchedule } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "gotify-mcp",
        version: "1.0.0",
    });
    server.registerTool("send_message", {
        title: "Send message",
        description: "Push a notification via Gotify.",
        inputSchema: z.object({
            title: z.string().describe("Message title."),
            message: z.string().describe("Message body."),
            priority: z.string().describe("0-10 (default 5).").optional()
        }),
        annotations: MUTATING,
    }, async ({ title, message, priority }) => {
        try {
            return text(await sendMessage(title, message, priority));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_messages", {
        title: "List messages",
        description: "Messages stored on the Gotify server, newest first.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listMessages(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_apps", {
        title: "List applications",
        description: "Registered Gotify applications.",
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
    server.registerTool("alert_payload", {
        title: "Alert payload",
        description: "Build and validate the exact Gotify alert body for a title, message, priority, click URL and extras, and report its size against Android's 4096-byte cap. Sends nothing.",
        inputSchema: z.object({
            title: z.string().describe("Alert title, up to 200 characters."),
            message: z.string().describe("Alert body text."),
            priority: z.enum(["min", "low", "default", "high", "max"]).default("default").describe("Gotify priority name."),
            tags: z.string().describe("Optional comma separated tags to carry in the message.").optional(),
            click: z.string().describe("Optional http or https URL the tap opens.").optional(),
            extras: z.string().describe("Optional extras as a raw JSON object.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await alertPayload(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("retry_schedule", {
        title: "Retry schedule",
        description: "The concrete retry ladder for a push pipeline: exponential backoff from a base delay, capped, with reproducible full-jitter waits and the cumulative time a client would spend.",
        inputSchema: z.object({
            base_delay_ms: z.number().int().min(1).max(3600000).default(1000).describe("First backoff window in milliseconds."),
            multiplier: z.number().min(1).max(10).default(2).describe("Growth factor per attempt."),
            cap_ms: z.number().int().min(1).default(300000).describe("Ceiling for any single backoff window."),
            attempts: z.number().int().min(1).max(30).default(6).describe("How many retries to plan."),
            jitter: z.enum(["full", "none"]).default("full").describe("Jitter to spread retries out.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await retrySchedule(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "gotify-mcp";
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
