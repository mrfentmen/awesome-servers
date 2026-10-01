import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchClaims, searchChannel } from "./api.js";
import { premiumTool } from "./gateway.js";
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
        }
    });
    server.registerTool("video_details", {
        title: "Video details",
        description: "Resolve one Odysee video URL into its full claim: title, duration, views, publish date, license, tags and description.",
        inputSchema: z.object({ url: z.string().describe("lbry:// or https://odysee.com URL.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: video_details ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_odysee_video_details", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("channel_profile", {
        title: "Channel profile",
        description: "Resolve an Odysee channel handle into its public record: upload count, creation date, activation height and support amount.",
        inputSchema: z.object({ channel: z.string().describe("Channel handle like @veritasium.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: channel_profile ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_odysee_channel_profile", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("recent_uploads", {
        title: "Recent uploads",
        description: "Discover Odysee streams ordered by release time, optionally restricted to a channel claim ID.",
        inputSchema: z.object({ channel_id: z.string().optional(), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: recent_uploads ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_odysee_recent_uploads", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("supported_channels", {
        title: "Supported channels",
        description: "Discover channels ranked by effective LBC amount, with their reported upload count and canonical URLs. This is not a view or popularity ranking.",
        inputSchema: z.object({ limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: supported_channels ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_odysee_supported_channels", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
