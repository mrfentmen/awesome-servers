import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listChannels, getHistory, postMessage, listUsers, userInfo, channelInfo, threadReplies, emojiList, pinMessage, setTopic, serviceIncidentHistory, incidentServiceRanking } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "slack-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_channels", {
        title: "List channels",
        description: "Public channels in the workspace, with id and name.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 200).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listChannels(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_history", {
        title: "Channel history",
        description: "Recent messages in one channel, newest last.",
        inputSchema: z.object({
            channel: z.string().describe("Channel ID, e.g. C0123456789"),
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ channel, limit }) => {
        try {
            return text(await getHistory(channel, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("post_message", {
        title: "Post message",
        description: "Post a message to a channel as the bot, visible to everyone.",
        inputSchema: z.object({
            channel: z.string().describe("Channel ID, e.g. C0123456789"),
            message: z.string().describe("Message text.")
        }),
        annotations: MUTATING,
    }, async ({ channel, message }) => {
        try {
            return text(await postMessage(channel, message));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_users", {
        title: "List users",
        description: "Workspace members.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 20, max 200).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listUsers(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("user_info", {
        title: "User info",
        description: "Member profile.",
        inputSchema: z.object({
            user: z.string().describe("User ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ user }) => {
        try {
            return text(await userInfo(user));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("channel_info", {
        title: "Channel info",
        description: "Channel details.",
        inputSchema: z.object({
            channel: z.string().describe("Channel ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ channel }) => {
        try {
            return text(await channelInfo(channel));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("thread_replies", {
        title: "Thread replies",
        description: "Replies in a thread.",
        inputSchema: z.object({
            channel: z.string().describe("Channel ID."),
            ts: z.string().describe("Parent timestamp.")
        }),
        annotations: READ_ONLY,
    }, async ({ channel, ts }) => {
        try {
            return text(await threadReplies(channel, ts));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("emoji_list", {
        title: "Custom emoji",
        description: "Workspace emoji.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await emojiList());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("pin_message", {
        title: "Pin message",
        description: "Pin a REAL message.",
        inputSchema: z.object({
            channel: z.string().describe("Channel ID."),
            timestamp: z.string().describe("Message ts.")
        }),
        annotations: MUTATING,
    }, async ({ channel, timestamp }) => {
        try {
            return text(await pinMessage(channel, timestamp));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("set_topic", {
        title: "Set topic",
        description: "Set a REAL channel topic.",
        inputSchema: z.object({
            channel: z.string().describe("Channel ID."),
            topic: z.string().describe("New topic.")
        }),
        annotations: MUTATING,
    }, async ({ channel, topic }) => {
        try {
            return text(await setTopic(channel, topic));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("service_incident_history", {
        title: "Service incident history",
        description: "Slack's own published incident record for one service (Messaging, Files, Search, Connect, Apps/Integrations/APIs, ...): how often it was hit, when, how many status updates, and what the last update said. Needs no workspace token.",
        inputSchema: z.object({
            service: z.string().describe("Slack service name, e.g. Messaging, Files, Search, Connectivity."),
            limit: z.number().describe("Max incidents listed, 1-25. Defaults to 8.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: service_incident_history ----
        const paywallMessage = await premiumRequired("service_incident_history");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await serviceIncidentHistory(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("incident_service_ranking", {
        title: "Incident service ranking",
        description: "Which Slack services have been hit most often in a chosen window, ranked with share of incidents, the most recent date each was affected, and whatever is active right now. Aggregates Slack's published status record. Needs no workspace token.",
        inputSchema: z.object({
            days: z.number().describe("Look-back window in days, 7-365. Defaults to 180.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await incidentServiceRanking(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
