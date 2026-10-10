import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, queryTable, listUsers, callRpc, storageBuckets, storageObjects, authUser, createUser, deleteUser, insertRow, updateRows, deleteRows, schemaReview, platformStatus, postgresVersionWatch } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "supabase-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "query_table",
    {
      title: "Query table",
      description: "Rows from one table, with select and limit applied.",
      inputSchema: z.object({
        table: z.string().describe("Table name, e.g. customers"),
        select: z.string().describe("Columns (default *).").optional(),
        limit: z.string().describe("Max rows (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ table, select, limit }) => {
      try {
        return text(await queryTable(table, select, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Auth users in the project, one page at a time.",
      inputSchema: z.object({
        page: z.string().describe("Page (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ page }) => {
      try {
        return text(await listUsers(page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "call_rpc",
    {
      title: "Call RPC",
      description: "Call a Postgres function by name with JSON parameters.",
      inputSchema: z.object({
        function_name: z.string().describe("Function name."),
        params: z.string().describe("JSON params.").optional()
      }),
      annotations: MUTATING,
    },
    async ({ function_name, params }) => {
      try {
        return text(await callRpc(function_name, params));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "storage_buckets",
    {
      title: "Storage buckets",
      description: "All buckets.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await storageBuckets());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "storage_objects",
    {
      title: "Bucket objects",
      description: "Files in a bucket.",
      inputSchema: z.object({
        bucket: z.string().describe("Bucket name."),
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ bucket, limit }) => {
      try {
        return text(await storageObjects(bucket, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "auth_user",
    {
      title: "Auth user",
      description: "User by ID.",
      inputSchema: z.object({
        user_id: z.string().describe("User UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ user_id }) => {
      try {
        return text(await authUser(user_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "create_user",
    {
      title: "Create user",
      description: "Create a REAL user.",
      inputSchema: z.object({
        email: z.string().describe("Email."),
        password: z.string().describe("Password.").optional()
      }),
      annotations: MUTATING,
    },
    async ({ email, password }) => {
      try {
        return text(await createUser(email, password));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "delete_user",
    {
      title: "Delete user",
      description: "Delete a REAL user.",
      inputSchema: z.object({
        user_id: z.string().describe("User UUID.")
      }),
      annotations: MUTATING,
    },
    async ({ user_id }) => {
      try {
        return text(await deleteUser(user_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "insert_row",
    {
      title: "Insert row",
      description: "Insert a REAL row.",
      inputSchema: z.object({
        table: z.string().describe("Table name."),
        row_json: z.string().describe("Row as JSON.")
      }),
      annotations: MUTATING,
    },
    async ({ table, row_json }) => {
      try {
        return text(await insertRow(table, row_json));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "update_rows",
    {
      title: "Update row",
      description: "Update a REAL row by id.",
      inputSchema: z.object({
        table: z.string().describe("Table name."),
        row_id: z.string().describe("Row id."),
        patch_json: z.string().describe("Patch as JSON.")
      }),
      annotations: MUTATING,
    },
    async ({ table, row_id, patch_json }) => {
      try {
        return text(await updateRows(table, row_id, patch_json));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "delete_rows",
    {
      title: "Delete row",
      description: "Delete a REAL row by id.",
      inputSchema: z.object({
        table: z.string().describe("Table name."),
        row_id: z.string().describe("Row id.")
      }),
      annotations: MUTATING,
    },
    async ({ table, row_id }) => {
      try {
        return text(await deleteRows(table, row_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "schema_review",
    {
      title: "Schema review",
      description: "Review CREATE TABLE DDL the way a Supabase project is actually used, computed locally: missing primary keys, foreign keys with no index, foreign keys with no ON DELETE action, timestamp without time zone, legacy serial, char padding, untyped json, and above all whether row level security is enabled anywhere, which decides whether the table is reachable through PostgREST.",
      inputSchema: z.object({ ddl: z.string().describe("One or more CREATE TABLE statements, up to 40000 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await schemaReview(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "platform_status",
    {
      title: "Platform status",
      description: "How the hosted Supabase platform is behaving: the headline status, every tracked component by state, anything not operational named individually, and the split between per-region capacity components and platform services such as the API gateway, auth and storage.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (_args) => {
    // ---- paywall: platform_status ----
    const paywallMessage = await premiumRequired("platform_status")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await platformStatus(_args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "postgres_version_watch",
    {
      title: "Postgres version watch",
      description: "Which Postgres version lines are still supported and when each reaches end of life, from postgresql.org: the current release lines with their latest minor, every supported major with the days left before it stops getting fixes, anything losing support within a year, and the lines already past end of life.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (_args) => {
    // ---- paywall: postgres_version_watch ----
    const paywallMessage = await premiumRequired("postgres_version_watch")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await postgresVersionWatch(_args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}