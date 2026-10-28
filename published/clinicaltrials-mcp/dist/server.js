import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bySponsor, interventionSearch, recruitingByCondition, searchStudies, studyDetail, studyLocations, TrialsError, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof TrialsError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
const statusArg = z
    .string()
    .optional()
    .describe("Optional overall status, e.g. RECRUITING, COMPLETED, ACTIVE_NOT_RECRUITING");
export function createServer() {
    const server = new McpServer({ name: "clinicaltrials-mcp", version: "1.0.0" });
    server.tool("search_studies", "Search ClinicalTrials.gov by any term — condition, drug, sponsor or NCT id.", {
        term: z.string().min(2).describe("Free-text query, e.g. semaglutide obesity"),
        status: statusArg,
        limit: z.number().int().min(1).max(50).default(10).describe("Studies to return"),
    }, async ({ term, status, limit }) => {
        try {
            return text(await searchStudies(term, status, limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("study_detail", "Full protocol summary for one trial: status, phase, eligibility and primary outcomes.", { nct_id: z.string().min(11).describe("NCT id, e.g. NCT00801892") }, async ({ nct_id }) => {
        try {
            return text(await studyDetail(nct_id));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("recruiting_by_condition", "Trials currently recruiting patients for a condition.", {
        condition: z.string().min(2).describe("Condition, e.g. type 2 diabetes"),
        limit: z.number().int().min(1).max(50).default(10).describe("Studies to return"),
    }, async ({ condition, limit }) => {
        try {
            return text(await recruitingByCondition(condition, limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("by_sponsor", "Trials run by a company, university or agency.", {
        sponsor: z.string().min(2).describe("Sponsor name, e.g. Novartis"),
        limit: z.number().int().min(1).max(50).default(10).describe("Studies to return"),
    }, async ({ sponsor, limit }) => {
        try {
            return text(await bySponsor(sponsor, limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("intervention_search", "Trials testing a specific drug, device or procedure.", {
        intervention: z.string().min(2).describe("Intervention, e.g. pembrolizumab"),
        status: statusArg,
        limit: z.number().int().min(1).max(50).default(10).describe("Studies to return"),
    }, async ({ intervention, status, limit }) => {
        try {
            return text(await interventionSearch(intervention, status, limit));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("study_locations", "Where a trial runs, grouped by country.", { nct_id: z.string().min(11).describe("NCT id") }, async ({ nct_id }) => {
        try {
            return text(await studyLocations(nct_id));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
