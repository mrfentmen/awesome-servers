import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listBases, listTables, listRecords, getRecord, searchRecords, createRecord, updateRecord, deleteRecord, listWebhooks, recordComments, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const MUTATING = { readOnlyHint: false, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "airtable-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_bases", {
        title: "List bases",
        description: "Airtable bases the token can access.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listBases());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_tables", {
        title: "List tables",
        description: "Tables in one base, e.g. appXXXXXXXXXXXXXX.",
        inputSchema: z.object({
            base_id: z.string().describe("Base ID, e.g. appXXXXXXXXXXXXXX")
        }),
        annotations: READ_ONLY,
    }, async ({ base_id }) => {
        try {
            return text(await listTables(base_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_records", {
        title: "List records",
        description: "Records in one table, with an optional max_records cap.",
        inputSchema: z.object({
            base_id: z.string().describe("Base ID, e.g. appXXXXXXXXXXXXXX"),
            table: z.string().describe("Table name or ID."),
            max_records: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ base_id, table, max_records }) => {
        try {
            return text(await listRecords(base_id, table, max_records));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_record", {
        title: "Get record",
        description: "Single record.",
        inputSchema: z.object({
            base_id: z.string().describe("Base ID."),
            table: z.string().describe("Table name or ID."),
            record_id: z.string().describe("Record ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ base_id, table, record_id }) => {
        try {
            return text(await getRecord(base_id, table, record_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_records", {
        title: "Search records",
        description: "Formula filter.",
        inputSchema: z.object({
            base_id: z.string().describe("Base ID."),
            table: z.string().describe("Table name or ID."),
            formula: z.string().describe("filterByFormula."),
            max_records: z.string().describe("Max results (default 10, max 100).").optional()
        }),
        annotations: READ_ONLY,
    }, async ({ base_id, table, formula, max_records }) => {
        try {
            return text(await searchRecords(base_id, table, formula, max_records));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_record", {
        title: "Create record",
        description: "Create a REAL record.",
        inputSchema: z.object({
            base_id: z.string().describe("Base ID."),
            table: z.string().describe("Table name or ID."),
            fields_json: z.string().describe("Fields as JSON.")
        }),
        annotations: MUTATING,
    }, async ({ base_id, table, fields_json }) => {
        try {
            return text(await createRecord(base_id, table, fields_json));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("update_record", {
        title: "Update record",
        description: "Update a REAL record.",
        inputSchema: z.object({
            base_id: z.string().describe("Base ID."),
            table: z.string().describe("Table name or ID."),
            record_id: z.string().describe("Record ID."),
            fields_json: z.string().describe("Fields as JSON.")
        }),
        annotations: MUTATING,
    }, async ({ base_id, table, record_id, fields_json }) => {
        try {
            return text(await updateRecord(base_id, table, record_id, fields_json));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("delete_record", {
        title: "Delete record",
        description: "Delete a REAL record.",
        inputSchema: z.object({
            base_id: z.string().describe("Base ID."),
            table: z.string().describe("Table name or ID."),
            record_id: z.string().describe("Record ID.")
        }),
        annotations: MUTATING,
    }, async ({ base_id, table, record_id }) => {
        try {
            return text(await deleteRecord(base_id, table, record_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_webhooks", {
        title: "List webhooks",
        description: "Base webhooks.",
        inputSchema: z.object({
            base_id: z.string().describe("Base ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ base_id }) => {
        try {
            return text(await listWebhooks(base_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("record_comments", {
        title: "Record comments",
        description: "Comments on a record.",
        inputSchema: z.object({
            base_id: z.string().describe("Base ID."),
            table: z.string().describe("Table ID."),
            record_id: z.string().describe("Record ID.")
        }),
        annotations: READ_ONLY,
    }, async ({ base_id, table, record_id }) => {
        try {
            return text(await recordComments(base_id, table, record_id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    return server;
}
