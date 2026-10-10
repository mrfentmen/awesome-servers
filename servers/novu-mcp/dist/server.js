import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listSubscribers, getSubscriber, listTopics, topicDetails, notifications, environments, integrations, layouts, feeds, blueprintGroups, notificationApiAudit, novuSdkReleaseCheck } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "novu-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_subscribers", {
        title: "Subscribers",
        description: "Notification subscribers, with email and id.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listSubscribers(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_subscriber", {
        title: "Get subscriber",
        description: "One subscriber by id, with channels and data.",
        inputSchema: z.object({
            subscriber_id: z.string().describe("Subscriber ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ subscriber_id }) => {
        try {
            return text(await getSubscriber(subscriber_id));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_topics", {
        title: "Topics",
        description: "Notification topics with subscriber counts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listTopics());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("topic_details", {
        title: "Topic details",
        description: "Single topic.",
        inputSchema: z.object({
            topic_key: z.string().describe("Topic key.")
        }),
        annotations: READ_ONLY,
    }, async ({ topic_key }) => {
        try {
            return text(await topicDetails(topic_key));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("notifications", {
        title: "Notifications",
        description: "Templates list.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await notifications(limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("environments", {
        title: "Environments",
        description: "All environments.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await environments());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("integrations", {
        title: "Integrations",
        description: "Providers.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await integrations());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("layouts", {
        title: "Layouts",
        description: "Email layouts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await layouts());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("feeds", {
        title: "Feeds",
        description: "Notification feeds.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await feeds());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("blueprint_groups", {
        title: "Blueprint groups",
        description: "Grouped blueprints.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await blueprintGroups());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("notification_api_audit", {
        title: "Notification API audit",
        description: "Audit Novu's own published OpenAPI document: how many operations it declares, the declared servers and security schemes, the busiest tags, how many operations ship with no summary or description, which are deprecated, and an operationId table. Optionally filtered by a path or operationId fragment.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(30).default(12).describe("Operations to print (default 12, max 30)."), filter: z.string().describe("Only operations whose path or operationId contains this text.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: notification_api_audit ----
        const paywallMessage = await premiumRequired("notification_api_audit");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await notificationApiAudit(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("novu_sdk_release_check", {
        title: "Novu SDK release check",
        description: "How current and how used one of Novu's npm packages is: latest version and how long ago it shipped, every dist-tag, how many releases landed in the last year, monthly download count, deprecated versions and the recent release dates.",
        inputSchema: z.object({ package: z.string().describe("npm package name, e.g. @novu/node or @novu/api."), limit: z.number().int().min(1).max(20).default(6).describe("Recent releases to print (default 6, max 20).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: novu_sdk_release_check ----
        const paywallMessage = await premiumRequired("novu_sdk_release_check");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await novuSdkReleaseCheck(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
