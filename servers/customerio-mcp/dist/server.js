import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listCustomers, getCustomer, listSegments, segmentDetails, campaigns, campaignDetails, newsletters, activities, customerActivities, customerMessages, broadcastMetrics, campaignMetrics, segmentMembers } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "customerio-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_customers", {
        title: "List customers",
        description: "Tracked customers with email and attributes.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listCustomers(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_customer", {
        title: "Get customer",
        description: "One customer profile by id, with its attributes.",
        inputSchema: z.object({
            identifier: z.string().describe("ID or email.")
        }),
        annotations: READ_ONLY,
    }, async ({ identifier }) => {
        try {
            return text(await getCustomer(identifier));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_segments", {
        title: "List segments",
        description: "Segments with id, name and member counts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listSegments());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("segment_details", {
        title: "Segment details",
        description: "Single segment.",
        inputSchema: z.object({
            segment_id: z.string().describe("Segment ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ segment_id }) => {
        try {
            return text(await segmentDetails(segment_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("campaigns", {
        title: "Campaigns",
        description: "All campaigns.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await campaigns());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("campaign_details", {
        title: "Campaign details",
        description: "Single campaign.",
        inputSchema: z.object({
            campaign_id: z.string().describe("Campaign ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ campaign_id }) => {
        try {
            return text(await campaignDetails(campaign_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("newsletters", {
        title: "Newsletters",
        description: "All newsletters.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await newsletters());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("activities", {
        title: "Activities",
        description: "Workspace activity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await activities());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("customer_activities", {
        title: "Customer activity",
        description: "Activity for a customer.",
        inputSchema: z.object({
            identifier: z.string().describe("ID or email.")
        }),
        annotations: READ_ONLY,
    }, async ({ identifier }) => {
        try {
            return text(await customerActivities(identifier));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("customer_messages", {
        title: "Customer messages",
        description: "Messages for a customer.",
        inputSchema: z.object({
            identifier: z.string().describe("ID or email.")
        }),
        annotations: READ_ONLY,
    }, async ({ identifier }) => {
        try {
            return text(await customerMessages(identifier));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("broadcast_metrics", {
        title: "Broadcast metrics",
        description: "Delivery, open, click, reply and unsubscribe metrics for one Customer.io broadcast, aggregated across the requested window. Rates use Customer.io's own documented denominators, so messages with tracking inactive are removed from the base, and human clicks are separated from machine clicks, which is what makes the numbers trustworthy.",
        inputSchema: z.object({
            broadcast_id: z.string().describe("Numeric broadcast id."),
            period: z.string().default("days").describe("hours, days, weeks or months, default days"),
            steps: z.number().int().min(2).max(121).optional().describe("How many periods to return. Capped by period: 24 hours, 45 days, 12 weeks, 121 months"),
            type: z.string().optional().describe("Restrict to one channel: email, webhook, twilio, whatsapp, slack, push, in_app or live_notification"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: broadcast_metrics ----
        const paywallMessage = await premiumRequired("broadcast_metrics");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await broadcastMetrics(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("campaign_metrics", {
        title: "Automation metrics",
        description: "The same delivery, open, click, reply and unsubscribe metrics for one Customer.io automation, which is what shows whether a journey is actually working rather than merely running. Uses the documented tracked denominators and reports human clicks separately from machine ones.",
        inputSchema: z.object({
            campaign_id: z.string().describe("Numeric automation id, as shown on the automation page."),
            period: z.string().default("days").describe("hours, days, weeks or months, default days"),
            steps: z.number().int().min(2).max(121).optional().describe("How many periods to return. Capped by period: 24 hours, 45 days, 12 weeks, 121 months"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: campaign_metrics ----
        const paywallMessage = await premiumRequired("campaign_metrics");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await campaignMetrics(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("segment_members", {
        title: "Segment members",
        description: "The people actually inside one Customer.io segment, with their cio_id, id and email where set, and the next-page token when more members remain. This is the membership behind the segment size the dashboard shows.",
        inputSchema: z.object({
            segment_id: z.string().describe("Numeric segment id, found on the segment page under Usage."),
            limit: z.number().int().min(1).max(1000).default(50).describe("Members to return, default 50"),
            start: z.string().optional().describe("Next-page token returned by a previous call."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await segmentMembers(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
