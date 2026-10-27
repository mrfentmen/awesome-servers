import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { deviceEvents, deviceRecalls, foodRecalls, labelSearch, m0_adverseEvents, m0_approvedDrugs, m0_drugRecalls, m1_events, ndcLookup, topReactions } from './api.js';
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'openfda-mcp', version: '1.0.0' });
    server.registerTool("get_drug_recalls", {
        title: "Get drug recalls",
        description: "Get recent FDA drug recalls, optionally filtered by product or reason.",
        inputSchema: z.object({ search: z.string().describe("Optional search terms like salmonella.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_drugRecalls(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_adverse_events", {
        title: "Search adverse events",
        description: "Search FDA adverse event reports by drug name.",
        inputSchema: z.object({ drug: z.string().describe("Drug name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_adverseEvents(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_approved_drugs", {
        title: "Search approved drugs",
        description: "Search approved drug applications.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_approvedDrugs(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("events", {
        title: "Events",
        description: "Drug adverse event reports for a drug.",
        inputSchema: z.object({ drug: z.string().describe("Brand name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_events(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("device_recalls", {
        title: "Device recalls",
        description: "FDA medical device recalls.",
        inputSchema: z.object({ search: z.string().describe("Optional search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await deviceRecalls(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("device_events", {
        title: "Device events",
        description: "Adverse events for a device.",
        inputSchema: z.object({ device: z.string().describe("Device generic name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await deviceEvents(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("food_recalls", {
        title: "Food recalls",
        description: "FDA food recalls and alerts.",
        inputSchema: z.object({ search: z.string().describe("Optional search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await foodRecalls(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("label_search", {
        title: "Label search",
        description: "Drug label purpose and use.",
        inputSchema: z.object({ query: z.string().describe("Brand or generic name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await labelSearch(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("top_reactions", {
        title: "Top reactions",
        description: "Most reported reactions for a drug.",
        inputSchema: z.object({ drug: z.string().describe("Drug name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await topReactions(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("ndc_lookup", {
        title: "NDC lookup",
        description: "Drug product by NDC code.",
        inputSchema: z.object({ code: z.string().describe("NDC code.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ndcLookup(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
