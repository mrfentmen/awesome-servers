import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, listCustomers, listThreads, getThread, emailDeliverability, responseTimeReport } from "./api.js";
import { premiumRequired } from "./license.js";
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
            return textError(errorMessage(e));
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
        // ---- paywall: email_deliverability ----
        const paywallMessage = await premiumRequired("email_deliverability");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await emailDeliverability(args));
        }
        catch (e) {
            return textError(errorMessage(e));
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
        // ---- paywall: response_time_report ----
        const paywallMessage = await premiumRequired("response_time_report");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await responseTimeReport(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
