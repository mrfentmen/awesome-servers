import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ecbPolicyRate, exchangeRate, exchangeRateHistory, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "ecb-mcp", version: "1.0.0" });
    server.tool("exchange_rate", "Latest ECB reference rate for one currency against the euro.", {
        currency: z.string().length(3).describe('ISO currency code, e.g. "USD" or "JPY"')
    }, async (a) => {
        try {
            return text(await exchangeRate(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("exchange_rate_history", "Recent daily reference rates for a currency.", {
        currency: z.string().length(3).describe("ISO currency code"),
        limit: z.number().int().min(1).max(90).default(10).describe("Days to return")
    }, async (a) => {
        try {
            return text(await exchangeRateHistory(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("ecb_policy_rate", "Latest ECB main refinancing operations rate.", {}, async (a) => {
        try {
            return text(await ecbPolicyRate());
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
