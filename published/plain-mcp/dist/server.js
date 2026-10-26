import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listCustomers, listThreads, getThread, emailDeliverability, responseTimeReport } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "plain-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_customers", {
        title: "List customers",
        description: "Support customers with email and company.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listCustomers(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_threads", {
        title: "List threads",
        description: "Open support threads, newest first.",
        inputSchema: z.object({
            limit: z.string().describe("Max results (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            return text(await listThreads(limit));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_thread", {
        title: "Get thread",
        description: "One thread by id, with messages and status.",
        inputSchema: z.object({
            thread_id: z.string().describe("Plain thread ID from the inbox URL")
        }),
        annotations: READ_ONLY,
    }, async ({ thread_id }) => {
        try {
            return text(await getThread(thread_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("email_deliverability", {
        title: "Email deliverability",
        description: "Whether mail to an address can be delivered: the domain's MX records in delivery order, its SPF and DMARC policy, its null-MX status and any problems that would make a reply bounce.",
        inputSchema: z.object({
            email: z.string().describe("Email address or bare domain, e.g. 'someone@example.com' or 'example.com'"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await emailDeliverability(args.email));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("response_time_report", {
        title: "First-response time report",
        description: "First-response times for a batch of support threads against a target: fastest, median, mean, 90th percentile, the breach count and the slowest threads.",
        inputSchema: z.object({
            target_hours: z.number().describe("Response-time target in hours, e.g. 4 or 24"),
            samples: z.array(z.object({
                label: z.string().describe("Thread id or title, used to identify the row.").optional(),
                created_at: z.string().describe("ISO 8601 timestamp the thread was created."),
                first_reply_at: z.string().describe("ISO 8601 timestamp of the first agent reply."),
            })).describe("Up to 200 threads with a creation and a first-reply timestamp."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(responseTimeReport(args.target_hours, args.samples));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "plain-mcp";
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
