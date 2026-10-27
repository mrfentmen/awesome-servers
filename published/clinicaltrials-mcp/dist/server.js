import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { byIntervention, byPhase, bySponsor, m0_search, m1_clinicalTrials, m1_pubmed, m1_trial, recruiting, trialLocations } from './api.js';
const text = (value) => ({ content: [{ type: 'text', text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
const errorMessage = error;
export function createServer() {
    const server = new McpServer({ name: 'clinicaltrials-mcp', version: '1.0.0' });
    server.registerTool("search", {
        title: "Search",
        description: "Search clinical trials.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m0_search(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_clinical_trials", {
        title: "Search clinical trials",
        description: "Search clinical trials by condition or keyword.",
        inputSchema: z.object({ query: z.string().describe("Condition or keyword like diabetes."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_clinicalTrials(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("get_trial", {
        title: "Get trial",
        description: "Get one clinical trial by NCT id.",
        inputSchema: z.object({ nct_id: z.string().describe("NCT id like NCT00000123.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_trial(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_pubmed", {
        title: "Search pubmed",
        description: "Search PubMed research articles.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await m1_pubmed(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("recruiting", {
        title: "Recruiting",
        description: "Currently recruiting trials, optional keyword.",
        inputSchema: z.object({ query: z.string().describe("Condition or keyword.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recruiting(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("by_phase", {
        title: "By phase",
        description: "Trials by phase 1-4.",
        inputSchema: z.object({ phase: z.string().describe("1, 2, 3 or 4.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await byPhase(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("by_sponsor", {
        title: "By sponsor",
        description: "Trials by sponsor organization.",
        inputSchema: z.object({ sponsor: z.string().describe("Sponsor name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await bySponsor(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("by_intervention", {
        title: "By intervention",
        description: "Trials testing a drug or intervention.",
        inputSchema: z.object({ intervention: z.string().describe("Drug name."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await byIntervention(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("trial_locations", {
        title: "Trial locations",
        description: "Sites running one trial.",
        inputSchema: z.object({ nct_id: z.string().describe("NCT id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await trialLocations(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
