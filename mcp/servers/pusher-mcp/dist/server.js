import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listChannels, getChannel, getChannelUsers } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "pusher-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_channels", {
        title: "List channels",
        description: "Active channels with user counts.",
        inputSchema: z.object({
            prefix: z.string().describe("Name prefix filter.").optional(),
            limit: z.string().describe("Max results (default 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ prefix, limit }) => {
        try {
            return text(await listChannels(prefix, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_channel", {
        title: "Channel details",
        description: "Occupancy details for a channel.",
        inputSchema: z.object({
            channel: z.string().describe("Channel name.")
        }),
        annotations: READ_ONLY,
    }, async ({ channel }) => {
        try {
            return text(await getChannel(channel));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_channel_users", {
        title: "Channel users",
        description: "User IDs subscribed to a presence channel.",
        inputSchema: z.object({
            channel: z.string().describe("Presence channel name.")
        }),
        annotations: READ_ONLY,
    }, async ({ channel }) => {
        try {
            return text(await getChannelUsers(channel));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("websocket_round_trip", {
        title: "Websocket round trip",
        description: "Open a real websocket and measure it: handshake time, round-trip time across several frames, jitter and effective throughput, using a public echo endpoint as the control.",
        inputSchema: z.object({
            payload_kb: z.number().describe("Payload body size per frame in KB, 1-64. Defaults to 4.").optional(),
            samples: z.number().describe("How many frames to send, 2-20. Defaults to 5.").optional(),
            url: z.string().describe("Websocket URL to test. Defaults to a public echo endpoint.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: websocket_round_trip ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_pusher_websocket_round_trip", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("websocket_payload_probe", {
        title: "Websocket payload probe",
        description: "Push the awkward payloads through a websocket — empty, single character, multi-byte UTF-8, a JSON document and a large frame — and report what came back and how long it took.",
        inputSchema: z.object({
            url: z.string().describe("Websocket URL to test. Defaults to a public echo endpoint.").optional(),
            large_kb: z.number().describe("Size of the large probe frame in KB, 1-512. Defaults to 48.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: websocket_payload_probe ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_pusher_websocket_payload_probe", args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
