import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchClaims, searchChannel } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "odysee-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_claims", {
        title: "Search videos",
        description: "Search Odysee videos by keyword: claim ids, titles, channels, durations.",
        inputSchema: z.object({
            query: z.string().describe("Search text"),
            size: z.number().default(10).describe("How many results"),
        }),
        annotations: READ_ONLY,
    }, async ({ query, size }) => {
        try {
            return text(await searchClaims(query, size));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_channel", {
        title: "Search channel videos",
        description: "Recent Odysee uploads from one channel handle, e.g. '@NASA'.",
        inputSchema: z.object({
            channel: z.string().describe("Channel handle like '@NASA'"),
            size: z.number().default(10).describe("How many results"),
        }),
        annotations: READ_ONLY,
    }, async ({ channel, size }) => {
        try {
            return text(await searchChannel(channel, size));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("video_details", {
        title: "Video details",
        description: "Resolve one Odysee video URL into its full claim: title, duration, views, publish date, license, tags and description.",
        inputSchema: z.object({ url: z.string().describe("lbry:// or https://odysee.com URL.") }),
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
    server.registerTool("channel_profile", {
        title: "Channel profile",
        description: "Resolve an Odysee channel handle into its public record: upload count, creation date, activation height and support amount.",
        inputSchema: z.object({ channel: z.string().describe("Channel handle like @veritasium.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recent_uploads", {
        title: "Recent uploads",
        description: "Discover Odysee streams ordered by release time, optionally restricted to a channel claim ID.",
        inputSchema: z.object({ channel_id: z.string().optional(), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement uploads locally (paywall removed)
        try {
            return textError("Not yet implemented: uploads");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("supported_channels", {
        title: "Supported channels",
        description: "Discover channels ranked by effective LBC amount, with their reported upload count and canonical URLs. This is not a view or popularity ranking.",
        inputSchema: z.object({ limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement channels locally (paywall removed)
        try {
            return textError("Not yet implemented: channels");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "odysee-mcp";
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
