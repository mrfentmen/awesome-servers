import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getPath, parseToml, toToml, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "toml-mcp", version: "1.0.0" })

  server.tool(
    "parse_toml",
    "Parse TOML text into JSON, with line and column on any syntax error.",
    {
      toml: z.string().min(1).describe("TOML document text")
    },
    async (a) => {
      try {
        return text(await parseToml(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "to_toml",
    "Convert a JSON object into TOML text, using [tables] for nested objects.",
    {
      json: z.string().min(2).describe("JSON object text")
    },
    async (a) => {
      try {
        return text(await toToml(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_path",
    "Read one value from TOML by dotted path, e.g. project.name or servers[0].host.",
    {
      toml: z.string().min(1).describe("TOML document text"),
      path: z.string().min(1).describe('Dotted path, e.g. "server.port" or "servers[0].host"')
    },
    async (a) => {
      try {
        return text(await getPath(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
