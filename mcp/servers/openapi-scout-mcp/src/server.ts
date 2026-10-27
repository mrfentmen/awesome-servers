import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, operation, schemas, summary } from "./scout.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
const file = z.string().min(1).max(1000).describe("Local JSON OpenAPI or Swagger file. No network URLs are accepted.")
export function createServer() {
  const server = new McpServer({ name: "openapi-scout-mcp", version: "1.0.0" })
  server.tool("inspect_spec", "Summarize a local OpenAPI or Swagger JSON file, including operations and servers, while redacting examples, defaults, and credential-like data.", { file }, async ({ file: target }) => { try { return text(format(await summary(target))) } catch (error) { return errorText(error) } })
  server.tool("find_operation", "Find one operation by operationId in a local OpenAPI or Swagger JSON file.", { file, operationId: z.string().min(1).max(200) }, async ({ file: target, operationId }) => { try { const result = await operation(target, operationId); return text(result ? format(result) : `No operationId found: ${operationId}`) } catch (error) { return errorText(error) } })
  server.tool("list_schemas", "List local OpenAPI component schemas or Swagger definitions with sensitive example values redacted.", { file }, async ({ file: target }) => { try { return text(format(await schemas(target))) } catch (error) { return errorText(error) } })
  return server
}
