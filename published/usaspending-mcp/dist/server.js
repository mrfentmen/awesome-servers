import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { m0_agencies, m0_searchAwards, m1_federalAwards, m1_nonprofits, m2_agencyDetails, m2_awardDetails, m2_categorySpending, m2_recipientSearch } from './api.js';
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'usaspending-mcp', version: '1.0.0' });
    server.registerTool("agencies", {
        title: "Agencies",
        description: "Top tier federal agencies.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_agencies(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_awards", {
        title: "Search awards",
        description: "Search federal awards by keyword.",
        inputSchema: z.object({ keyword: z.string().describe("Award keyword."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_searchAwards(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_federal_awards", {
        title: "Search federal awards",
        description: "Search federal contract awards by keyword.",
        inputSchema: z.object({ query: z.string().describe("Keyword like cybersecurity or construction."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_federalAwards(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_nonprofits", {
        title: "Search nonprofits",
        description: "Search nonprofit organizations and their filings.",
        inputSchema: z.object({ query: z.string().describe("Organization name or EIN."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_nonprofits(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("agency_details", {
        title: "Agency details",
        description: "Outlays and obligations for one agency.",
        inputSchema: z.object({ code: z.string().describe("Agency code like 012."), year: z.string().describe("Fiscal year.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m2_agencyDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("category_spending", {
        title: "Category spending",
        description: "Spending by category like awarding_agency.",
        inputSchema: z.object({ category: z.string().describe("Category like awarding_agency.").optional(), year: z.string().describe("Fiscal year.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m2_categorySpending(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("recipient_search", {
        title: "Recipient search",
        description: "Find award recipients by keyword.",
        inputSchema: z.object({ keyword: z.string().describe("Recipient keyword."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m2_recipientSearch(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("award_details", {
        title: "Award details",
        description: "One award by generated id.",
        inputSchema: z.object({ id: z.string().describe("Generated award id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m2_awardDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
