import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, getStatus, listMetrics, requestWaterfall, loadSample } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "k6-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_status", {
        title: "Runtime status",
        description: "k6 run state, VUs, iterations.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getStatus());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_metrics", {
        title: "List metrics",
        description: "Metric names a k6 run can report.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listMetrics());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("request_waterfall", {
        title: "Request waterfall",
        description: "Measure where the time goes on a single request: DNS resolution, TCP connect, TLS, and the full transfer with status, content type, bytes read and server header. Works without a k6 instance.",
        inputSchema: z.object({ url: z.string().describe("URL to measure, e.g. https://example.com"), timeout_ms: z.number().int().min(1000).max(60000).default(15000).describe("Connect and read timeout in milliseconds."), bytes: z.number().int().min(0).max(5000000).default(262144).describe("How many body bytes to read (default 262,144).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: request_waterfall ----
        const paywallMessage = await premiumRequired("request_waterfall");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await requestWaterfall(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("load_sample", {
        title: "Load sample",
        description: "Sample an endpoint up to 200 times at a chosen concurrency and report min, p50, p90, p99, max, mean, jitter, the status mix and the achieved request rate. Works without a k6 instance.",
        inputSchema: z.object({ url: z.string().describe("URL to sample, e.g. https://example.com"), samples: z.number().int().min(2).max(200).default(20).describe("How many requests to make (default 20, max 200)."), concurrency: z.number().int().min(1).max(20).default(5).describe("How many in flight at once (default 5, max 20)."), timeout_ms: z.number().int().min(1000).max(60000).default(10000).describe("Per-request timeout in milliseconds.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: load_sample ----
        const paywallMessage = await premiumRequired("load_sample");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await loadSample(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
