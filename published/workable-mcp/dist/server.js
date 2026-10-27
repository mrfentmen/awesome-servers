import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { companies, companyJobs, jobDetail, marketSummary, recentJobs, remoteJobs, searchJobs, compareQueries, companyOpenings, workplaceSplit, remoteSalary, remoteMarket } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "workable-mcp", version: "1.0.0" });
    server.registerTool("search_jobs", {
        title: "Search jobs",
        description: "Search live roles on company career sites powered by Workable (roughly 170,000 open jobs). " +
            "Filter by keyword, location or both.",
        inputSchema: z.object({
            query: z.string().describe("Job keyword, e.g. 'data engineer', 'nurse'.").optional(),
            location: z.string().describe("Location filter, e.g. 'London', 'Berlin', 'remote'.").optional(),
            limit: z.number().describe("Max roles to show (default 10, max 20).").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchJobs(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("job_detail", {
        title: "Job detail",
        description: "Full posting for one job: company, location, contract type, apply link and the description text.",
        inputSchema: z.object({
            job_id: z.string().describe("Job id from search_jobs."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await jobDetail(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("company_jobs", {
        title: "Company jobs",
        description: "Every open role on one company's Workable board, e.g. board 'stealth-it'.",
        inputSchema: z.object({
            board: z.string().describe("Workable board slug, e.g. 'stealth-it'."),
            limit: z.number().describe("Max roles to show (default 20, max 50).").optional(),
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
    server.registerTool("companies", {
        title: "Companies hiring",
        description: "Which companies are hiring for a keyword, ranked by how many roles they have open.",
        inputSchema: z.object({
            query: z.string().describe("Job keyword, e.g. 'rust developer'."),
            location: z.string().describe("Optional location filter.").optional(),
            limit: z.number().describe("Max companies to show (default 15, max 20).").optional(),
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
    server.registerTool("market_summary", {
        title: "Market summary",
        description: "Rough shape of the job market for a keyword: top employers, locations, contract types and departments.",
        inputSchema: z.object({
            query: z.string().describe("Job keyword, e.g. 'product manager'."),
            location: z.string().describe("Optional location filter.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await marketSummary(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("remote_jobs", {
        title: "Remote jobs",
        description: "List only remote, hybrid or on-site roles, using Workable's own workplace filter rather than sorting through mixed results.",
        inputSchema: z.object({
            query: z.string().describe("Keywords, e.g. 'customer support'.").optional(),
            location: z.string().describe("Optional location filter, e.g. 'Berlin'.").optional(),
            workplace: z.enum(["remote", "hybrid", "on_site"]).describe("Which workplace mode to keep. Defaults to remote.").optional(),
            limit: z.number().describe("How many roles to show, 1-20.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await remoteJobs(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("recent_jobs", {
        title: "Newest jobs",
        description: "Sort Workable results by posting date, newest first, and report how fresh the sample actually is.",
        inputSchema: z.object({
            query: z.string().describe("Keywords, e.g. 'data analyst'.").optional(),
            location: z.string().describe("Optional location filter, e.g. 'Austin'.").optional(),
            limit: z.number().describe("How many roles to show, 1-20.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recentJobs(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("compare_queries", {
        title: "Compare search demand",
        description: "Open-role counts for two to five searches side by side, ranked, using the API's own totals - a direct read on which skill the market is hiring for.",
        inputSchema: z.object({
            queries: z.array(z.string()).describe('Searches to compare, e.g. ["rust", "go", "elixir"]'),
            location: z.string().describe("Restrict every count to a location, e.g. 'Berlin'. Optional.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ queries, location }) => {
        try {
            return text(await compareQueries({ queries, location }));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("company_openings", {
        title: "One company's openings",
        description: "Every open role from one employer, found through the market search and filtered to that company, with its workplace mix.",
        inputSchema: z.object({
            company: z.string().describe("Company name, e.g. 'Stripe'"),
            query: z.string().describe("Broader search to sample from. Defaults to the company name.").optional(),
            limit: z.number().describe("How many roles to show, 1-20. Defaults to 15.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ company, query, limit }) => {
        try {
            return text(await companyOpenings({ company, query, limit }));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("workplace_split", {
        title: "Remote vs hybrid vs on-site",
        description: "How a search splits between remote, hybrid and on-site roles, using the API's own workplace filter on each of the three counts.",
        inputSchema: z.object({
            query: z.string().describe("Search term, e.g. 'product manager'"),
            location: z.string().describe("Restrict to a location, e.g. 'London'. Optional.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ query, location }) => {
        try {
            return text(await workplaceSplit({ query, location }));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("remote_market", {
        title: "Remote market",
        description: "The wider remote market for a role, read from a different job board than the rest of this server: who is hiring remotely, in which categories, on which contract types, how many publish salary, how old the listings are, and which skills keep appearing. No Workable token needed.",
        inputSchema: z.object({
            query: z.string().describe("Role or skill to search for, e.g. python, designer, data engineer"),
            limit: z.number().describe("Listings shown, 1-50. Defaults to 12.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await remoteMarket(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("remote_salary", {
        title: "Remote salary",
        description: "What remote listings pay, from only those that state it: median band midpoints by currency, category and contract type, the full range, and how much of the market declines to publish anything at all. No Workable token needed.",
        inputSchema: z.object({
            query: z.string().describe("Role or skill to price. Defaults to 'developer'.").optional(),
            limit: z.number().describe("Listings examined, 10-100. Defaults to 50.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await remoteSalary(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
