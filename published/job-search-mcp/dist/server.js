import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, searchJobs, latestJobs, jobsByBoard, companyJobs, salaryInsights, boardCoverage, jobCategories, jobsLastHours, skillDemand, hiringThread, roleTaxonomy } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const boardsArg = z
    .string()
    .describe("Comma-separated board ids to limit the search, e.g. jobicy,themuse. Default: all six.")
    .optional();
export function createServer() {
    const server = new McpServer({ name: "job-search-mcp", version: "1.0.0" });
    server.registerTool("search_jobs", {
        title: "Search jobs",
        description: "Search six public job boards at once (Jobicy, Arbeitnow, RemoteOK, The Muse, Remotive, Hacker News) and get merged, de-duplicated results with company, location, salary where the board exposes one, and a link. Use this for any job hunt.",
        inputSchema: z.object({
            query: z.string().describe("Role or skill keywords, e.g. python developer.").optional(),
            category: z.string().describe("Industry or role keyword to narrow results, e.g. engineering.").optional(),
            location: z.string().describe("Location filter, e.g. USA, Germany, New York.").optional(),
            boards: boardsArg,
            limit: z.number().describe("How many jobs to show, 1-50 (default 10).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ query, category, location, boards, limit }) => {
        try {
            const combined = [query, category].filter((part) => part && part.trim()).join(" ");
            return text(await searchJobs({ query: combined, location, boards, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("latest_jobs", {
        title: "Latest jobs",
        description: "The newest postings across all six boards, newest first, with no keyword needed. Good for 'what jobs came out today'.",
        inputSchema: z.object({
            location: z.string().describe("Location filter, e.g. USA.").optional(),
            boards: boardsArg,
            limit: z.number().describe("How many jobs to show, 1-50 (default 10).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ location, boards, limit }) => {
        try {
            return text(await latestJobs({ location, boards, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("jobs_by_board", {
        title: "Jobs by board",
        description: "Query one specific job board on its own, for when you want a single source instead of the merged feed. Jobicy and Hacker News filter server-side; the others are filtered over their latest postings.",
        inputSchema: z.object({
            board: z.string().describe("Board id: jobicy, arbeitnow, remoteok, themuse, remotive, or hn."),
            query: z.string().describe("Role or skill keywords, e.g. rust.").optional(),
            location: z.string().describe("Location filter, e.g. Germany.").optional(),
            limit: z.number().describe("How many jobs to show, 1-50 (default 10).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ board, query, location, limit }) => {
        try {
            return text(await jobsByBoard({ board, query, location, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("company_jobs", {
        title: "Company jobs",
        description: "Every open posting at a company across all six boards, matched on the company name. Useful before an interview or when tracking a shortlist.",
        inputSchema: z.object({
            company: z.string().describe("Company name or part of it, e.g. stripe."),
            boards: boardsArg,
            limit: z.number().describe("How many jobs to show, 1-50 (default 10).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ company, boards, limit }) => {
        try {
            return text(await companyJobs({ company, boards, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("job_categories", {
        title: "Job categories",
        description: "The job boards this server aggregates, their ids, and how each one filters — so an agent knows which board to target for a given query.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(await jobCategories());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("salary_insights", {
        title: "Salary insights",
        description: "Scan the job boards for a keyword and summarise the pay that postings actually disclosed: lowest, median and highest USD-per-year figure, plus the best paying matches.",
        inputSchema: z.object({
            query: z.string().describe('Job keywords to focus on, e.g. "backend engineer" or "data analyst". Omit to scan all recent postings.').optional(),
            boards: z.string().describe('Comma separated board ids to use, e.g. "jobicy,remoteok". Defaults to all six.').optional(),
            limit: z.number().describe("How many best paying matches to list, 1-50.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await salaryInsights(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("board_coverage", {
        title: "Board coverage",
        description: "Compare how many jobs each aggregated board returns for a query, and report which boards are unreachable, so an agent knows where a search is actually coming from.",
        inputSchema: z.object({
            query: z.string().describe('Optional keywords to compare coverage for, e.g. "devops".').optional(),
            location: z.string().describe('Optional location to compare coverage for, e.g. "Berlin".').optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await boardCoverage(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("jobs_last_hours", {
        title: "Jobs last hours",
        description: "Postings published inside a time window - what is actually new, with a per-board count.",
        inputSchema: z.object({
            hours: z.number().describe("Window in hours, 1-720 (default 24).").optional(),
            query: z.string().describe("Optional keyword filter.").optional(),
            location: z.string().describe("Optional location filter.").optional(),
            boards: z.string().describe("Comma-separated board ids (default all).").optional(),
            limit: z.number().describe("Max postings to list (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await jobsLastHours(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("skill_demand", {
        title: "Skill demand",
        description: "Which skills, tags and companies appear most often across the boards' latest postings.",
        inputSchema: z.object({
            query: z.string().describe("Optional keyword filter, e.g. rust.").optional(),
            boards: z.string().describe("Comma-separated board ids (default all).").optional(),
            limit: z.number().describe("Max tags to rank (default 10, max 50).").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await skillDemand(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("hiring_thread", {
        title: "Hiring thread",
        description: "The real job listings inside an Ask HN: Who is hiring thread. The comment bodies are not in the search index, so this reads them from the HN item API and prints the posting lines as their authors wrote them.",
        inputSchema: z.object({ month: z.string().describe("Month or year fragment of the thread, e.g. 'March 2018'. The biggest thread by default.").optional(), limit: z.number().int().min(1).max(40).default(15).describe("How many postings to print (default 15, max 40)."), comments: z.number().int().min(10).max(200).default(60).describe("How many top level comments to read (default 60, max 200).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: hiring_thread ----
        try {
            return text(await hiringThread(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("role_taxonomy", {
        title: "Role taxonomy",
        description: "What kinds of roles the live aggregate actually contains, grouped by title family with the share of postings, example titles and the boards each family came from.",
        inputSchema: z.object({ query: z.string().describe("Restrict the harvest to these keywords.").optional(), limit: z.number().int().min(1).max(30).default(12).describe("How many families to print (default 12, max 30)."), sample: z.number().int().min(10).max(300).default(120).describe("How many postings per board to pull (default 120, max 300)."), boards: z.string().describe("Comma separated board ids, e.g. remotive,arbeitnow.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: role_taxonomy ----
        try {
            return text(await roleTaxonomy(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
