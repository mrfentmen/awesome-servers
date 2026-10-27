import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { gcdLcm, primeFactors, stats } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "math-tools-mcp", version: "1.0.0" });
    server.registerTool("prime_factors", {
        title: "Prime factors",
        description: "Prime factors of a number.",
        inputSchema: z.object({ value: z.number().describe("Integer up to 1e12.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await primeFactors(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("gcd_lcm", {
        title: "Gcd lcm",
        description: "Greatest common divisor and least common multiple.",
        inputSchema: z.object({ a: z.number().describe("First number."), b: z.number().describe("Second number.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await gcdLcm(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("stats", {
        title: "Stats",
        description: "Mean, median, mode, and standard deviation of a list.",
        inputSchema: z.object({ values: z.string().describe("Comma separated numbers.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await stats(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sequence_lookup", {
        title: "Sequence lookup",
        description: "Identify an integer sequence with the OEIS: sequence number, name, offset, terms, formula and keywords.",
        inputSchema: z.object({ terms: z.string().describe("Comma or space separated terms, or an A-number such as A000045."), limit: z.number().describe("Max sequences, 1-10, default 5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement lookup locally (paywall removed)
        try {
            return textError("Not yet implemented: lookup");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("evaluate_expression", {
        title: "Evaluate expression",
        description: "Evaluate a maths expression or unit conversion on the mathjs service, for example 2^10, det([[1,2],[3,4]]) or 5 km in miles.",
        inputSchema: z.object({ expression: z.string().describe("Expression to evaluate, up to 300 characters."), precision: z.number().int().min(1).max(64).optional().describe("Significant digits, 1-64.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement expression locally (paywall removed)
        try {
            return textError("Not yet implemented: expression");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "math-tools-mcp";
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
