import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, createQuery, getQueryStatus, getQueryResults, cancelQuery, savedQueries, runSavedQuery, tableSchema } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const NON_READ_ONLY = { openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "flipside-mcp",
        version: "1.0.0",
    });
    server.registerTool("create_query", {
        title: "Run SQL query",
        description: "Submit a Flipside SQL query run against curated blockchain tables. Returns a token; poll status then fetch results.",
        inputSchema: z.object({
            sql: z.string().describe("SQL, e.g. 'SELECT * FROM ethereum.core.fact_transactions LIMIT 5'"),
            dataSource: z.string().default("snowflake").describe("Engine: snowflake or ..."),
            dataProvider: z.string().default("flipside").describe("Provider, usually flipside"),
        }),
        annotations: READ_ONLY,
    }, async ({ sql, dataSource, dataProvider }) => {
        try {
            return text(await createQuery(sql, dataSource, dataProvider));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_query_status", {
        title: "Get query status",
        description: "Poll a Flipside query run: pending, running, finished or failed with row count.",
        inputSchema: z.object({
            token: z.string().describe("Query token from create_query"),
        }),
        annotations: READ_ONLY,
    }, async ({ token }) => {
        try {
            return text(await getQueryStatus(token));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_query_results", {
        title: "Get query results",
        description: "Fetch result rows for a finished Flipside query run, paged.",
        inputSchema: z.object({
            token: z.string().describe("Token from the previous page"),
            pageNumber: z.number().default(1).describe("Page number, 1 or higher"),
            pageSize: z.number().default(100).describe("Rows per page, max 100000"),
        }),
        annotations: READ_ONLY,
    }, async ({ token, pageNumber, pageSize }) => {
        try {
            return text(await getQueryResults(token, pageNumber, pageSize));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("cancel_query", {
        title: "Cancel query run",
        description: "Cancel a pending or running Flipside query.",
        inputSchema: z.object({
            token: z.string().describe("Token from the previous page"),
        }),
        annotations: NON_READ_ONLY,
    }, async ({ token }) => {
        try {
            return text(await cancelQuery(token));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("saved_queries", {
        title: "Flipside's saved query library",
        description: "Lists the queries Flipside publishes as a maintained library, by category, and gives the exact name to run each one. This is the alternative to writing SQL yourself: each saved query is a piece of analysis written by someone who knows Flipside's table layout, which is documented nowhere else. Filter by category, or search within a category's queries by name and description.",
        inputSchema: z.object({
            category: z.string().optional().describe("Category slug, e.g. protocol, tokenUnlocks, dao, nft. Omit to list all categories with counts."),
            search: z.string().optional().describe("Text to match in query names and descriptions. Only applies with a category."),
            limit: z.number().int().min(1).max(200).default(25).describe("Queries to list for a category, default 25"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: saved_queries ----
        const paywallMessage = await premiumRequired("saved_queries");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await savedQueries(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("run_saved_query", {
        title: "Run a saved query",
        description: "Runs one of Flipside's saved queries by name, with the same asynchronous run, poll and fetch cycle the existing create_query uses. Data source and provider are optional because a saved query was written for a particular chain and omitting them uses that. A saved query can stop working when Flipside changes a table, and the failure then looks like an ordinary SQL error rather than an out-of-date query.",
        inputSchema: z.object({
            query_name: z.string().describe("Exact saved query name as Flipside lists it. Matched lowercased; the name is the identifier."),
            data_source: z.string().optional().describe("Override the chain, e.g. ethereum. Omit to use the query's own chain."),
            data_provider: z.string().optional().describe("Override the data provider. Omit to use the query's default."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: run_saved_query ----
        const paywallMessage = await premiumRequired("run_saved_query");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await runSavedQuery(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("table_schema", {
        title: "Table list and column layout",
        description: "Lists the tables on a Flipside data source, or shows the columns of one table with their types and Flipside's own descriptions. This is the missing prerequisite for create_query, which needs SQL written against column names that are documented nowhere else. Table names are chain-specific, so the same logical data is often named differently on each chain and a query written for ethereum will not run on base.",
        inputSchema: z.object({
            data_source: z.string().describe("Flipside data source name, e.g. ethereum, solana, base, arbitrum, polygon, bsc. Not a chain id."),
            table: z.string().optional().describe("Table to describe. Omit to list the tables on this data source."),
            search: z.string().optional().describe("Filter the table list by substring, e.g. 'uniswap' or 'nft'."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await tableSchema(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
