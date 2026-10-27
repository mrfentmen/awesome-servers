import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { countries, holidays, countryCoverage } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "enrico-mcp", version: "1.0.0" });
    server.registerTool("countries", {
        title: "Countries",
        description: "List supported countries.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await countries());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("holidays", {
        title: "Holidays",
        description: "Public holidays for a country and year.",
        inputSchema: z.object({ country: z.string().describe("Country code like USA."), year: z.number().describe("Year.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await holidays(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("country_coverage", {
        title: "Country coverage",
        description: "What the Enrico holiday service actually covers across all its countries: every holiday type in the catalogue and how many countries offer each, the earliest year any country starts at, which countries name a real end year rather than a placeholder, and which countries are split into regions. The countries tool prints only a code and a name and stops at 30 of them.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await countryCoverage());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("country_calendar", {
        title: "Country calendar",
        description: "Every holiday type Enrico serves for one country in one year, not just public holidays: observances, other days, extra working days, school holidays and postal holidays, with the English name where the record carries one, the weekday, the country's real coverage window and its region codes. The holidays tool reads a single type and takes only the first name in each record.",
        inputSchema: z.object({ country: z.string().describe("Three letter country code like USA or DEU."), year: z.number().describe("Year, 1940 to 2100.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement calendar locally (paywall removed)
        try {
            return textError("Not yet implemented: calendar");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "enrico-mcp";
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
