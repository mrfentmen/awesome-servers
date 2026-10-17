import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { parseYaml } from "./api.js"
import { toJson, listOperations, listRepoContents } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "yaml-mcp", version: "1.0.0" })
  server.registerTool(
    "parse_yaml",
    {
      title: "Parse yaml",
      description: "Parse YAML into a readable structure.",
      inputSchema: z.object( { yaml: z.string().describe("YAML text.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await parseYaml(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "to_json",
    {
      title: "To json",
      description: "Convert YAML text to JSON.",
      inputSchema: z.object( { yaml: z.string().describe("YAML text.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await toJson(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "openapi_operations",
    {
      title: "Openapi operations",
      description: "Download an OpenAPI or Swagger spec (JSON or YAML) from a URL and list its operations: method, path, operationId, tags and summary.",
      inputSchema: z.object({ url: z.string().describe("https URL of the spec."), limit: z.number().describe("Max operations, 1-200, default 25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listOperations(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "repo_file_listing",
    {
      title: "Repo file listing",
      description: "List the files and directories at a path in a public GitHub repository, with type and size, so you can find the config or manifest you want to parse.",
      inputSchema: z.object({ repo: z.string().describe("Repository as owner/name, for example kubernetes/kubernetes."), path: z.string().describe("Path inside the repository. Defaults to the root.").optional(), limit: z.number().describe("Max entries, 1-100, default 30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listRepoContents(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
