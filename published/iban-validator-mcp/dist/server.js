import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { info } from "./api.js";
import { validate, bbanStructure, batchValidate } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "iban-validator-mcp", version: "1.0.0" });
    server.registerTool("validate", {
        title: "Validate",
        description: "Check if an IBAN is valid.",
        inputSchema: z.object({ iban: z.string().describe("The IBAN to check.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await validate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("info", {
        title: "Info",
        description: "Show country and structure for an IBAN.",
        inputSchema: z.object({ iban: z.string().describe("The IBAN to inspect.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await info(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("bban_structure", {
        title: "BBAN structure",
        description: "Break an IBAN into its BBAN fields for that country, show the ISO 7064 mod 97 arithmetic, and recompute the national check digits where the country's scheme is tabulated. Pure local maths.",
        inputSchema: z.object({ iban: z.string().describe("The IBAN to break down.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bbanStructure(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("batch_validate", {
        title: "Batch validate",
        description: "Validate a list of up to 200 IBANs at once and summarise them: how many pass, a per-country tally, and for each failure whether the length, the mod 97 check digits or the shape is wrong.",
        inputSchema: z.object({
            ibans: z.string().describe("IBANs separated by commas, spaces or newlines."),
            limit: z.number().int().min(1).max(200).describe("Max IBANs to check, 1-200, default 50.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await batchValidate(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "iban-validator-mcp";
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
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
