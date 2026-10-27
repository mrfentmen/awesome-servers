import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzeHistory, format } from "./history.js";
import { historyCohortSpread, historyFlapPatterns } from "./local-api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "flaky-history-mcp", version: "1.0.0" });
    server.registerTool("analyze_test_history", {
        title: "Analyze test history",
        description: "Aggregate local test history into stability signals without returning test names, file names, raw records, or exact versions.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async ({ project }) => {
        try {
            return text(format(await analyzeHistory(project)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("history_cohort_spread", {
        title: "History cohort spread",
        description: "Split local history files into per-file cohorts and report how failure is distributed between them: mean and median cohort failure rate, dispersion, a rate histogram, cohort size statistics and concentration. No test names, file names, paths or raw records are returned.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await historyCohortSpread(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("history_flap_patterns", {
        title: "History flap patterns",
        description: "Analyse outcome sequencing inside each local history file and report flip rates, the longest pass-fail alternation and how many cohorts are genuinely flapping. Only cohort indices and formats are shown, never test names, file names or records.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await historyFlapPatterns(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("public_workflow_history", {
        title: "Public workflow history",
        description: "Summarize recent public GitHub Actions workflow conclusions and rerun attempt counts.",
        inputSchema: z.object({ owner: z.string().min(1).max(100).default("microsoft"), repo: z.string().min(1).max(100).default("TypeScript"), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement history locally (paywall removed)
        try {
            return textError("Not yet implemented: history");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("public_run_bottlenecks", {
        title: "Public run bottlenecks",
        description: "Find the longest elapsed jobs and failed-step counts in a public GitHub Actions run; defaults to a recent completed run.",
        inputSchema: z.object({ owner: z.string().min(1).max(100).default("microsoft"), repo: z.string().min(1).max(100).default("TypeScript"), limit: z.number().optional(), run_id: z.string().regex(/^\d{1,20}$/).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement bottlenecks locally (paywall removed)
        try {
            return textError("Not yet implemented: bottlenecks");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "flaky-history-mcp";
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
function error(e) { return e instanceof Error ? e.message : String(e); }
