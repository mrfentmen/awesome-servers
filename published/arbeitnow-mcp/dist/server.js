import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { companies, companyJobs, hiringTrends, job, jobs, locations, remoteJobs, searchJobs, similarJobs, tags } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "arbeitnow-mcp", version: "1.0.0" });
    server.registerTool("jobs", {
        title: "Jobs",
        description: "List the newest Arbeitnow job postings, 250 per page, with tags, location and remote flag.",
        inputSchema: z.object({
            limit: z.number().describe("Max results to show, 1-50, e.g. 25 for a quick scan.").optional(),
            page: z.number().describe("Page of the live feed, 1-20, e.g. 2 for the next page.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await jobs(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_jobs", {
        title: "Search jobs",
        description: "Search the 500 newest Arbeitnow jobs by title, company, location, tag or job type.",
        inputSchema: z.object({
            query: z.string().describe("Words to match, for example python or Berlin."),
            limit: z.number().describe("Max matches to show, 1-50.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchJobs(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("remote_jobs", {
        title: "Remote jobs",
        description: "List only the remote-friendly jobs among the 500 newest Arbeitnow postings.",
        inputSchema: z.object({
            limit: z.number().describe("Max results to show, 1-50, e.g. 30 to see more remote roles.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await remoteJobs(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("job", {
        title: "Job detail",
        description: "Get one Arbeitnow job by its slug, including the full description and apply link.",
        inputSchema: z.object({
            slug: z.string().describe("Job slug, e.g. the slug field returned by list_jobs or search_jobs.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await job(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tags", {
        title: "Top tags",
        description: "Show which skills and categories appear most often in the newest Arbeitnow jobs.",
        inputSchema: z.object({
            limit: z.number().describe("How many tags to show, 1-50, e.g. 20 for the main skills.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tags(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("companies", {
        title: "Companies hiring",
        description: "Rank the employers with the most open Arbeitnow postings, with their remote count and newest posting date.",
        inputSchema: z.object({
            limit: z.number().describe("How many companies to show, 1-50, e.g. 25 for the busiest employers.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await companies(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("locations", {
        title: "Locations and job types",
        description: "Show where the newest Arbeitnow jobs are, split by city and by job type, with a remote versus on-site count.",
        inputSchema: z.object({
            limit: z.number().describe("How many locations and types to show, 1-50, e.g. 15 for the top cities.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await locations(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("company_jobs", {
        title: "Company jobs",
        description: "List every open posting from one employer across the 300 newest Arbeitnow jobs, newest first.",
        inputSchema: z.object({
            company: z.string().describe("Company name or part of it, for example SAP or Siemens."),
            limit: z.number().describe("Max results to show, 1-50, e.g. 25.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await companyJobs(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("similar_jobs", {
        title: "Similar jobs",
        description: "Other Arbeitnow postings that share tags with a job, or come from the same employer, ranked by overlap.",
        inputSchema: z.object({
            slug: z.string().describe("Job slug, as returned by the jobs or search_jobs tools."),
            limit: z.number().describe("Max similar jobs to show, 1-30, e.g. 10.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await similarJobs(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hiring_trends", {
        title: "Hiring trends",
        description: "New Arbeitnow postings per day, the remote share and the job types, over up to six feed pages.",
        inputSchema: z.object({
            pages: z.number().describe("How many feed pages to scan, 1-6, e.g. 4 for 400 jobs.").optional(),
            days: z.number().describe("How many days of the trend to show, 1-21, e.g. 14.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hiringTrends(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("related_tags", {
        title: "Related tags",
        description: "For one skill or category tag, the other tags that appear on the same Arbeitnow postings, ranked by how many of the tag's postings each shares, with that share.",
        inputSchema: z.object({
            tag: z.string().describe("Tag exactly as Arbeitnow prints it, e.g. Software Engineering."),
            pages: z.number().describe("How many feed pages to scan, 1-6. Defaults to 3.").optional(),
            limit: z.number().describe("How many partner tags to show, 1-25. Defaults to 10.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tags locally (paywall removed)
        try {
            return textError("Not yet implemented: tags");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
