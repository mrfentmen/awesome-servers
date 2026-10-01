import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatJson, jsonInfo, validateJson, schemaForFile } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "json-tools-mcp", version: "1.0.0" })
  server.registerTool(
    "validate_json",
    {
      title: "Validate json",
      description: "Check if a string is valid JSON and report errors.",
      inputSchema: z.object( { json: z.string().describe("JSON text to check.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await validateJson(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "format_json",
    {
      title: "Format json",
      description: "Pretty print a JSON string.",
      inputSchema: z.object( { json: z.string().describe("JSON text to format."), indent: z.number().describe("Indent spaces.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await formatJson(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "json_info",
    {
      title: "Json info",
      description: "Return the top level type and key count of JSON.",
      inputSchema: z.object( { json: z.string().describe("JSON text to inspect.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jsonInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "find_schema",
    {
      title: "Find schema",
      description: "Search the SchemaStore catalogue of 1400+ published JSON Schemas by topic, returning matching schema names, the config files they cover and their source URLs.",
      inputSchema: z.object( { query: z.string().min(1).max(120), limit: z.number().int().min(1).max(30).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: find_schema ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_json_tools_find_schema", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "schema_for_file",
    {
      title: "Schema for file",
      description: "Find the JSON Schema that describes a given config file name, then report its declared type, property list, required fields, $defs sections and published versions.",
      inputSchema: z.object( { filename: z.string().min(1).max(200) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await schemaForFile(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
