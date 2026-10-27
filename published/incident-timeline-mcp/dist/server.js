import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, summarizeIncidentTimeline } from "./core.js";
import { classifyLogLine } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "incident-timeline-mcp", version: "1.0.0" });
    server.registerTool("summarize_incident_timeline", {
        title: "Summarize incident timeline",
        description: "Summarize local log timeline gaps and severity counts without returning messages, IDs, paths, or IP addresses.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await summarizeIncidentTimeline(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("profile_incident_samples", {
        title: "Profile incident samples",
        description: "Compute a burst and inter-arrival profile over log text you supply: severity mix, timestamp coverage, relative-time bucket histogram, largest gap, burst ratio and an incident shape. Purely local, nothing is echoed back.",
        inputSchema: z.object({ samples: z.string().describe("Log text to profile, up to 200,000 characters."), bucket_seconds: z.number().int().min(5).max(3600).optional().describe("Histogram bucket width in seconds, 5-3600, default 60.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement samples locally (paywall removed)
        try {
            return textError("Not yet implemented: samples");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("classify_log_line", {
        title: "Classify log line",
        description: "Classify one log line you supply into a severity level, signal presence flags and a 0-10 severity score. The line text is never echoed back.",
        inputSchema: z.object({ line: z.string().describe("A single log line, up to 20,000 characters.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await classifyLogLine(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    const serverName = "incident-timeline-mcp";
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
