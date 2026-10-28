import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addBusinessDays, businessDaysBetween, dateDifference, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "date-math-mcp", version: "1.0.0" });
    server.tool("business_days_between", "Count weekdays between two dates, optionally skipping holidays.", {
        start: z.string().describe("Start date, YYYY-MM-DD"),
        end: z.string().describe("End date, YYYY-MM-DD"),
        holidays: z.array(z.string()).default([]).describe("Holiday dates, YYYY-MM-DD")
    }, async (a) => {
        try {
            return text(await businessDaysBetween(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("add_business_days", "Move a date forward or backward by a number of business days.", {
        date: z.string().describe("Starting date, YYYY-MM-DD"),
        days: z.number().int().describe("Business days to add (negative goes backwards)"),
        holidays: z.array(z.string()).default([]).describe("Holiday dates, YYYY-MM-DD")
    }, async (a) => {
        try {
            return text(await addBusinessDays(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("date_difference", "Calendar difference between two dates in years, months and days.", {
        from: z.string().describe("Earlier date, YYYY-MM-DD"),
        to: z.string().describe("Later date, YYYY-MM-DD")
    }, async (a) => {
        try {
            return text(await dateDifference(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
