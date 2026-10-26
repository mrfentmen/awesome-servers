import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { companies, companyJobs, geographies, industries, jobDetails, jobLevels, jobs, salaryBands, topSalaries, feedStatus, postingFreshness } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "jobicy-mcp", version: "1.0.0" });
    server.registerTool("jobs", {
        title: "Jobs",
        description: "List remote jobs, filtered by region (geo), industry or skill tag.",
        inputSchema: z.object({
            count: z.number().describe("Max results, 1-50.").optional(),
            geo: z.string().describe("Region filter, for example usa or europe.").optional(),
            industry: z.string().describe("Industry filter, for example marketing.").optional(),
            tag: z.string().describe("Skill tag filter, for example python.").optional()
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
    server.registerTool("job_details", {
        title: "Job details",
        description: "Get full descriptions for jobs matching a title, company or skill, searched across the 50 most recent postings.",
        inputSchema: z.object({
            query: z.string().describe("Words to match against job title, company, industry or summary."),
            geo: z.string().describe("Optional region filter, for example usa.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await jobDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("industries", {
        title: "Industries",
        description: "List the industries hiring the most remote workers right now, with open job counts.",
        inputSchema: z.object({
            geo: z.string().describe("Optional region filter, for example europe.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await industries(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("top_salaries", {
        title: "Top salaries",
        description: "List the highest-paying remote jobs that publish a salary, annualized for comparison.",
        inputSchema: z.object({
            count: z.number().describe("How many jobs to show, 1-50.").optional(),
            geo: z.string().describe("Region filter, for example usa.").optional(),
            industry: z.string().describe("Industry filter, for example software.").optional(),
            tag: z.string().describe("Skill tag filter, for example python.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await topSalaries(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("companies", {
        title: "Companies hiring",
        description: "Rank the companies with the most open remote jobs, including how many disclosed pay and the top published salary.",
        inputSchema: z.object({
            count: z.number().describe("How many companies to show, 1-50.").optional(),
            geo: z.string().describe("Region filter, for example usa.").optional(),
            industry: z.string().describe("Industry filter, for example finance.").optional(),
            tag: z.string().describe("Skill tag filter, for example react.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await companies(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("job_levels", {
        title: "Levels and pay",
        description: "Break remote hiring down by experience level and employment type, with the highest published salary in each level.",
        inputSchema: z.object({
            geo: z.string().describe("Optional region filter, for example europe.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await jobLevels(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("geographies", {
        title: "Where jobs are based",
        description: "Break the most recent remote jobs down by region, with the top published pay in each place.",
        inputSchema: z.object({
            count: z.number().describe("Unused, kept for symmetry with jobs.").optional(),
            industry: z.string().describe("Industry filter, for example marketing.").optional(),
            tag: z.string().describe("Skill tag filter, for example python.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await geographies(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("company_jobs", {
        title: "Company jobs",
        description: "List every open remote job from one company in the most recent postings, newest first.",
        inputSchema: z.object({
            company: z.string().describe("Company name or part of it, for example Automattic."),
            count: z.number().describe("How many jobs to show, 1-50.").optional(),
            geo: z.string().describe("Region filter, for example usa.").optional(),
            industry: z.string().describe("Industry filter, for example software.").optional(),
            tag: z.string().describe("Skill tag filter, for example react.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await companyJobs(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("salary_bands", {
        title: "Pay bands",
        description: "Show how published remote salaries are distributed, with the median and the share of jobs that disclose pay.",
        inputSchema: z.object({
            geo: z.string().describe("Region filter, for example europe.").optional(),
            industry: z.string().describe("Industry filter, for example finance.").optional(),
            tag: z.string().describe("Skill tag filter, for example python.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await salaryBands(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("feed_status", {
        title: "Feed status",
        description: "How the Jobicy feed itself is doing: API version, when it last updated, how many postings match the filters, the filters the service actually applied and its attribution notice.",
        inputSchema: z.object({ geo: z.string().describe("Country code filter, e.g. USA.").optional(), industry: z.string().describe("Industry filter.").optional(), tag: z.string().describe("Tag filter.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: feed_status ----
        try {
            return text(await feedStatus(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("posting_freshness", {
        title: "Posting freshness",
        description: "How old the postings in the feed actually are, in buckets under a day, a week, a month and older, with the median age and the newest titles - the feed header never says this.",
        inputSchema: z.object({ count: z.number().int().min(1).max(50).default(50).describe("How many postings to pull (default 50, the API maximum)."), geo: z.string().describe("Country code filter.").optional(), industry: z.string().describe("Industry filter.").optional(), tag: z.string().describe("Tag filter.").optional(), limit: z.number().int().min(1).max(20).default(5).describe("How many recent postings to list (default 5).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: posting_freshness ----
        try {
            return text(await postingFreshness(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
