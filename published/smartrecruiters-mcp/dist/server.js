import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { departments, hiringCompanies, jobs, posting, searchAllJobs, searchPostings, postingsPage, postingsByCountry, boardOverview, postingAge, locationSpread } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "smartrecruiters-mcp", version: "1.0.0" });
    server.registerTool("jobs", {
        title: "Jobs",
        description: "List a company SmartRecruiters job postings with location, department and posting id.",
        inputSchema: z.object({
            company: z.string().describe("Company id like BoschGroup or Continental."),
            limit: z.number().describe("How many postings to show, 1-50.").optional(),
            offset: z.number().describe("Skip this many postings to page through the board.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await jobs(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("posting", {
        title: "Posting detail",
        description: "Get one SmartRecruiters posting by id, with the full job description and apply link.",
        inputSchema: z.object({
            company: z.string().describe("Company id like BoschGroup."),
            posting_id: z.string().describe("Posting id, as returned by the jobs tool.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await posting(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_postings", {
        title: "Search postings",
        description: "Search a company SmartRecruiters board by title, location, department or function.",
        inputSchema: z.object({
            company: z.string().describe("Company id like BoschGroup."),
            query: z.string().describe("Words to match, for example engineer or Berlin."),
            limit: z.number().describe("How many matches to show, 1-50.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchPostings(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("departments", {
        title: "Hiring breakdown",
        description: "Show a company SmartRecruiters hiring split by department, function, industry and experience level.",
        inputSchema: z.object({
            company: z.string().describe("Company id like BoschGroup.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await departments(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("search_all_jobs", {
        title: "Search all companies",
        description: "Search SmartRecruiters job postings across every company at once, with optional country and remote filters.",
        inputSchema: z.object({
            keyword: z.string().describe("Job keywords, for example python developer or nurse."),
            country: z.string().describe("Keep only jobs in this country, for example United States, Germany or IT.").optional(),
            remote: z.boolean().describe("When true, keep only jobs flagged as remote.").optional(),
            limit: z.number().describe("How many jobs to show, 1-40.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchAllJobs(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("hiring_companies", {
        title: "Companies hiring",
        description: "Rank the companies posting the most SmartRecruiters jobs for a keyword, with a sample role each.",
        inputSchema: z.object({
            keyword: z.string().describe("Job keywords, for example data engineer or sales."),
            country: z.string().describe("Keep only jobs in this country, for example United Kingdom or FR.").optional(),
            limit: z.number().describe("How many companies to show, 1-25.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hiringCompanies(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("postings_page", {
        title: "Page a board",
        description: "Page deeper into a company board by offset, so a board with thousands of postings can be read past the newest hundred.",
        inputSchema: z.object({
            company: z.string().describe("Company identifier as used in its job URLs, e.g. 'BoschGroup'"),
            offset: z.number().describe("How many postings to skip, e.g. 100. Defaults to 0.").optional(),
            limit: z.number().describe("How many postings to return, 1-100. Defaults to 25.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ company, offset, limit }) => {
        try {
            return text(await postingsPage({ company, offset, limit }));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("postings_by_country", {
        title: "Postings by country",
        description: "One country's postings from a company board, filtered by the API itself, with the share of the whole board that country represents.",
        inputSchema: z.object({
            company: z.string().describe("Company identifier, e.g. 'Ubisoft2'"),
            country: z.string().describe("Two-letter country code, e.g. 'fr' or 'us'"),
            limit: z.number().describe("How many postings to return, 1-100. Defaults to 25.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ company, country, limit }) => {
        try {
            return text(await postingsByCountry({ company, country, limit }));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("board_overview", {
        title: "Board overview",
        description: "A company board as a whole: posting count, countries, departments, experience levels, contract types and how much of it is remote.",
        inputSchema: z.object({
            company: z.string().describe("Company identifier, e.g. 'BoschGroup'"),
        }),
        annotations: READ_ONLY,
    }, async ({ company }) => {
        try {
            return text(await boardOverview({ company }));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("posting_age", {
        title: "Posting age",
        description: "How long the adverts on a company board have actually been standing: age buckets, median and p90 age in days, release months, and the longest-standing postings still listed. Pages deeper than the first hundred.",
        inputSchema: z.object({
            company: z.string().describe("SmartRecruiters company id, e.g. BoschGroup"),
            pages: z.number().describe("Pages of 100 to sample, 1-20. Defaults to 6.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await postingAge(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("location_spread", {
        title: "Location spread",
        description: "Where a board's jobs sit on the map: busiest cities with remote counts and published coordinates, countries covered, remote and hybrid share, and how concentrated the board is in its busiest city.",
        inputSchema: z.object({
            company: z.string().describe("SmartRecruiters company id, e.g. BoschGroup"),
            pages: z.number().describe("Pages of 100 to sample, 1-20. Defaults to 6.").optional(),
            limit: z.number().describe("Max locations listed, 1-30. Defaults to 12.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await locationSpread(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
