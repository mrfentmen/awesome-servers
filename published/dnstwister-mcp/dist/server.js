import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fuzz, whois, fuzzSummary } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "dnstwister-mcp", version: "1.0.0" });
    server.registerTool("fuzz", {
        title: "Fuzz",
        description: "Fuzz a domain for lookalike domains.",
        inputSchema: z.object({ domain: z.string().describe("Domain to fuzz.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fuzz(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("whois", {
        title: "Whois",
        description: "Get whois data for a domain.",
        inputSchema: z.object({ domain: z.string().describe("Domain.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await whois(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("mx_check", {
        title: "MX check",
        description: "Whether one domain publishes an MX record, so it can receive mail. A different question from listing its lookalikes.",
        inputSchema: z.object({ domain: z.string().describe("Domain to check, e.g. example.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement check locally (paywall removed)
        try {
            return textError("Not yet implemented: check");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("parked_report", {
        title: "Parked report",
        description: "The parking score for one domain, whether it is dressed up like a real site and where it redirects to.",
        inputSchema: z.object({ domain: z.string().describe("Domain to check, e.g. example.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement report locally (paywall removed)
        try {
            return textError("Not yet implemented: report");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fuzz_summary", {
        title: "Fuzz summary",
        description: "How a domain's lookalikes break down by the method that generated them, with real counts and examples, instead of the flat list.",
        inputSchema: z.object({ domain: z.string().describe("Domain to summarise, e.g. example.com."), top: z.number().describe("Example domains to show per method, 1-10. Defaults to 3.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await fuzzSummary(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "dnstwister-mcp";
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
