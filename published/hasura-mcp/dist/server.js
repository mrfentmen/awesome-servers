import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exportMetadata, formatMetadata, formatSqlResult, HasuraError, runSql, metadataCensus, sqlAudit, graphqlBuilder } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "hasura-mcp",
        version: "1.0.0",
    });
    server.registerTool("export_metadata", {
        title: "Export metadata",
        description: "Hasura metadata: sources and tracked tables. Needs HASURA_ADMIN_SECRET.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            return text(formatMetadata(await exportMetadata()));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("run_sql", {
        title: "Run SQL",
        description: "Run read-only SQL against a Hasura Postgres source. Only SELECT/WITH queries are sent.",
        inputSchema: z.object({
            sql: z.string().describe("SELECT or WITH query"),
            source: z.string().default("default").describe("Source name"),
        }),
        annotations: READ_ONLY,
    }, async ({ sql, source }) => {
        try {
            const clean = sql.trim().toLowerCase();
            if (!(clean.startsWith("select") || clean.startsWith("with"))) {
                return textError("Error: only SELECT/WITH queries are allowed through this tool.");
            }
            return text(formatSqlResult(await runSql(sql, source)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("metadata_census", {
        title: "Metadata census",
        description: "Census of a Hasura metadata document you supply as JSON: every object kind it holds and its size, the sources, the relationship and action kind breakdown, the tables touched by the most relationships and the permission entry count. Computed locally, so it also works on a metadata file that is not applied to a server.",
        inputSchema: z.object({ metadata: z.string().describe("Hasura metadata export as JSON text, up to 4 MB.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await metadataCensus(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("sql_audit", {
        title: "SQL audit",
        description: "Static audit of a SQL statement with no database connection: what it starts with, whether it is read only under a SELECT/WITH rule, the tables it names, and how many joins, subqueries, CTEs, aggregates and window functions are in it, plus what to review before running it.",
        inputSchema: z.object({ sql: z.string().describe("The SQL statement to audit.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await sqlAudit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("graphql_builder", {
        title: "Graphql builder",
        description: "Build a GraphQL document for a Hasura schema from the tables and fields you name, with a depth budget, an operation type and an optional alias, so the query can be reviewed before it is sent.",
        inputSchema: z.object({
            tables: z.string().describe("Comma separated table names, e.g. users, posts"),
            fields: z.string().describe("Field overrides as table:field,field;table2:field.").optional(),
            depth: z.number().describe("Depth budget, 1-6.").optional(),
            operation: z.string().describe("query or mutation.").optional(),
            alias: z.string().describe("Optional alias prefix for the root fields.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await graphqlBuilder(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "hasura-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof HasuraError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
