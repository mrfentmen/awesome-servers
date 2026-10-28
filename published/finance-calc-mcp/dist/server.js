import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { compoundInterest, loanPayment, netPresentValue, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "finance-calc-mcp", version: "1.0.0" });
    server.tool("loan_payment", "Monthly payment, total cost and interest for a fixed-rate loan, with the first 12 amortisation rows.", {
        principal: z.number().positive().describe("Amount borrowed"),
        annualRatePercent: z.number().min(0).describe("Annual interest rate in percent, e.g. 6.5"),
        years: z.number().positive().max(50).describe("Loan term in years")
    }, async (a) => {
        try {
            return text(await loanPayment(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("compound_interest", "Future value of a lump sum with compounding, plus total interest.", {
        principal: z.number().positive().describe("Starting amount"),
        annualRatePercent: z.number().describe("Annual rate in percent"),
        years: z.number().positive().max(100).describe("Years invested"),
        compoundsPerYear: z.number().int().min(1).max(365).default(12).describe("Compounding frequency per year")
    }, async (a) => {
        try {
            return text(await compoundInterest(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("net_present_value", "NPV of a cash-flow series and its internal rate of return.", {
        ratePercent: z.number().describe("Discount rate in percent"),
        cashflows: z.array(z.number()).min(2).describe("Cash flows, starting with the initial outlay (usually negative)")
    }, async (a) => {
        try {
            return text(await netPresentValue(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
