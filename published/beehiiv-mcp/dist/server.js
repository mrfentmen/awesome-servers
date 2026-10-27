import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BeehiivError, findSubscriber, formatPost, listPosts, listPublications, publicationStats, listTiers } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "beehiiv-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_posts", {
        title: "List posts",
        description: "beehiiv publication posts with statuses and links.",
        inputSchema: z.object({
            publication_id: z.string().describe("Publication id, e.g. 'pub_abc123'"),
            limit: z.number().int().min(1).max(100).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ publication_id, limit }) => {
        try {
            const rows = await listPosts(publication_id, limit);
            if (rows.length === 0)
                return text("No posts.");
            return text(rows.map((p, i) => formatPost(p, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("find_subscriber", {
        title: "Find subscriber",
        description: "Find a beehiiv subscriber by email: status, tier, join date.",
        inputSchema: z.object({
            publication_id: z.string().describe("Publication id"),
            email: z.string().describe("Email address"),
        }),
        annotations: READ_ONLY,
    }, async ({ publication_id, email }) => {
        try {
            const s = await findSubscriber(publication_id, email);
            if (!s)
                return text(`No subscriber ${email}.`);
            return text(`${s.email ?? email}${s.status ? ` [${s.status}]` : ""}${s.tier ? ` — ${s.tier}` : ""}${s.created ? ` (since ${s.created})` : ""}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_publications", {
        title: "List publications",
        description: "Every beehiiv publication on the configured API key, with organisation, referral flag and active subscription count.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(10).describe("Max publications to return"),
            order_by: z.enum(["created", "name"]).optional().describe("Sort field, defaults to created"),
            order_direction: z.enum(["asc", "desc"]).optional().describe("Sort direction, defaults to asc"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listPublications(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("publication_stats", {
        title: "Publication stats",
        description: "Engagement stats for one beehiiv publication: active free and premium subscriptions, open and click rates, totals sent, unique opens and clicks.",
        inputSchema: z.object({
            publication_id: z.string().describe("Publication id, e.g. 'pub_abc123'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await publicationStats(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_tiers", {
        title: "List subscription tiers",
        description: "Paid subscription tiers of a beehiiv publication: name, status, active subscriber count and price points per currency and interval.",
        inputSchema: z.object({
            publication_id: z.string().describe("Publication id"),
            limit: z.number().int().min(1).max(100).default(25).describe("Max tiers to return"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listTiers(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "beehiiv-mcp";
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
    if (e instanceof BeehiivError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
