import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, operation, schemas, summary } from "./scout.js"
import { operationMatrix, redactionAudit, schemaShapeReport } from "./api.js"
import { premiumRequired } from "./license.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
const file = z.string().min(1).max(1000).describe("Local JSON OpenAPI or Swagger file. No network URLs are accepted.")
export function createServer() {
  const server = new McpServer({ name: "openapi-scout-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_spec",
    {
      title: "Inspect spec",
      description: "Summarize a local OpenAPI or Swagger JSON file, including operations and servers, while redacting examples, defaults, and credential-like data.",
      inputSchema: z.object( { file }),
      annotations: READ_ONLY,
    },
    async ({ file: target }) => { try { return text(format(await summary(target))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "find_operation",
    {
      title: "Find operation",
      description: "Find one operation by operationId in a local OpenAPI or Swagger JSON file.",
      inputSchema: z.object( { file, operationId: z.string().min(1).max(200) }),
      annotations: READ_ONLY,
    },
    async ({ file: target, operationId }) => { try { const result = await operation(target, operationId); return text(result ? format(result) : `No operationId found: ${operationId}`) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "list_schemas",
    {
      title: "List schemas",
      description: "List local OpenAPI component schemas or Swagger definitions with sensitive example values redacted.",
      inputSchema: z.object( { file }),
      annotations: READ_ONLY,
    },
    async ({ file: target }) => { try { return text(format(await schemas(target))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "operation_matrix",
    {
      title: "Operation matrix",
      description: "Coverage matrix over a local OpenAPI or Swagger file: operations per method, the read share, the tag distribution, path depth, and how many operations are missing an operationId, a tags block, a parameters block or a responses block. Counts only.",
      inputSchema: z.object({ file }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: operation_matrix ----
      const paywallMessage = await premiumRequired("operation_matrix")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await operationMatrix(args))
      } catch (error) {
        return errorText(error)
      }
    }
  )

  server.registerTool(
    "schema_shape_report",
    {
      title: "Schema shape report",
      description: "Shape census of a local OpenAPI or Swagger file's component schemas: how many properties they hold, how many are required, the property count distribution, the deepest schema nesting, which schema keywords are used and which schemas are widest. No property name is printed.",
      inputSchema: z.object({ file, limit: z.number().describe("Widest schemas to list, 1-40.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: schema_shape_report ----
      const paywallMessage = await premiumRequired("schema_shape_report")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await schemaShapeReport(args))
      } catch (error) {
        return errorText(error)
      }
    }
  )

  server.registerTool(
    "redaction_audit",
    {
      title: "Redaction audit",
      description: "How much of a local OpenAPI or Swagger file looks like material a reader should not see: how many keys match the example, default, security or credential pattern, how many security schemes are declared, and how many server URLs carry a path that gets dropped. Counts only, nothing suppressed is printed.",
      inputSchema: z.object({ file }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await redactionAudit(args))
      } catch (error) {
        return errorText(error)
      }
    }
  )

  return server
}
