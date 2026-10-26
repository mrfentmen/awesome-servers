import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exchangeRate, getBalances, listProfiles, WiseError, serviceHealth } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "wise-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_profiles", {
        title: "List profiles",
        description: "Your Wise profiles (personal, business) with ids.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listProfiles();
            if (rows.length === 0)
                return text("No Wise profiles.");
            return text(rows.map((p, i) => `${i + 1}. [${p.id}] ${p.name || p.type || "profile"}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_balances", {
        title: "Get balances",
        description: "Balances per currency for one Wise profile.",
        inputSchema: z.object({
            profile_id: z.string().describe("Numeric profile id (use list_profiles)"),
        }),
        annotations: READ_ONLY,
    }, async ({ profile_id }) => {
        try {
            const rows = await getBalances(profile_id);
            if (rows.length === 0)
                return text(`No balances for profile ${profile_id}.`);
            return text(rows.map((b, i) => `${i + 1}. ${b.amount ?? "?"} ${b.currency ?? "?"}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("exchange_rate", {
        title: "Exchange rate",
        description: "Current Wise mid-market rate between two currencies.",
        inputSchema: z.object({
            from: z.string().describe("Source currency, e.g. 'USD'"),
            to: z.string().describe("Target currency, e.g. 'EUR'"),
        }),
        annotations: READ_ONLY,
    }, async ({ from, to }) => {
        try {
            return text(`1 ${from.trim().toUpperCase()} = ${await exchangeRate(from, to)} ${to.trim().toUpperCase()}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("service_health", {
        title: "Service health",
        description: "Which parts of Wise are working: every status component (mobile app, website, account, payments, debit card, API, support) with its own state, how many incidents each has had, anything still open, and scheduled maintenance. No Wise token needed.",
        inputSchema: z.object({
            limit: z.number().describe("Components listed, 1-40. Defaults to 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await serviceHealth(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("incident_history", {
        title: "Incident history",
        description: "Wise's incident record as a reliability history: incidents per product area, mean and median time to resolve, the spread by year and impact, and the most recent faults with their last status note. Filterable by area. No Wise token needed.",
        inputSchema: z.object({
            area: z.string().describe("Match a product area, e.g. payments, API, debit card. Omit for all.").optional(),
            limit: z.number().describe("Rows listed per section, 1-30. Defaults to 10.").optional(),
        }),
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
    const serverName = "wise-mcp";
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
    if (e instanceof WiseError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
