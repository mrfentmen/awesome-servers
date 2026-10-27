import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convertBase, roman, spellNumber, continuedFraction } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "number-tools-mcp", version: "1.0.0" });
    server.registerTool("convert_base", {
        title: "Convert base",
        description: "Convert a number between bases.",
        inputSchema: z.object({ value: z.string().describe("The number as text."), from: z.number().describe("Source base 2 to 36.").optional(), to: z.number().describe("Target base 2 to 36.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await convertBase(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("roman", {
        title: "Roman",
        description: "Convert a number to or from roman numerals.",
        inputSchema: z.object({ value: z.string().describe("A number or roman numeral.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await roman(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("spell_number", {
        title: "Spell number",
        description: "Spell out a number in words.",
        inputSchema: z.object({ value: z.number().describe("Number up to 999,999.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await spellNumber(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("divisors", {
        title: "Divisors",
        description: "List the divisors of an integer with its prime factorisation, sum of divisors and abundant/perfect/deficient classification.",
        inputSchema: z.object({ value: z.number().int().describe("A non-zero integer, up to 1e12."), limit: z.number().int().min(4).max(500).describe("Max divisors to print, 4-500, default 48.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement divisors locally (paywall removed)
        try {
            return textError("Not yet implemented: divisors");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("continued_fraction", {
        title: "Continued fraction",
        description: "Expand a number, or a fraction like 355/113, as a simple continued fraction and show its convergents with their errors.",
        inputSchema: z.object({ value: z.number().describe("A number to expand.").optional(), from: z.string().describe("A fraction as text, e.g. 355/113.").optional(), terms: z.number().int().min(1).max(40).describe("Max terms, 1-40, default 8.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await continuedFraction(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "number-tools-mcp";
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
