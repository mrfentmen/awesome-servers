import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspect, plan } from "./sieve.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
const file = z.string().min(1).max(1000).describe("Local JSON Schema file. Network URLs are not accepted.")

export function createServer() {
  const server = new McpServer({ name: "schema-sieve-mcp", version: "1.0.0" })
  server.tool("inspect_schema", "Summarize a local JSON Schema's types, properties, required fields, composition, and constraints without returning examples or defaults.", { file }, async ({ file: target }) => { try { return text(format(await inspect(target))) } catch (error) { return errorText(error) } })
  server.tool("plan_fixture", "Create a privacy-safe placeholder plan for test fixture fields in a local JSON Schema. It does not fabricate or copy example data.", { file }, async ({ file: target }) => { try { return text(format(await plan(target))) } catch (error) { return errorText(error) } })
  return server
}
