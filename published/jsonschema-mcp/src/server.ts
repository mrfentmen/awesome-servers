import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { describeSchema, exampleFromSchema, validateJson, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "jsonschema-mcp", version: "1.0.0" })

  server.tool(
    "validate_json",
    "Validate a JSON instance against a JSON Schema and list every error found with its path.",
    {
      schema: z.string().min(2).describe("The JSON Schema, as JSON text"),
      instance: z.string().min(1).describe("The JSON document to validate, as JSON text"),
      maxErrors: z.number().int().min(1).max(50).default(20).describe("Stop after this many errors")
    },
    async (a) => {
      try {
        return text(await validateJson(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "describe_schema",
    "Explain a JSON Schema as a readable outline: types, required fields, bounds and nested structures.",
    {
      schema: z.string().min(2).describe("The JSON Schema, as JSON text"),
      depth: z.number().int().min(1).max(6).default(3).describe("How deep to descend into properties and items")
    },
    async (a) => {
      try {
        return text(await describeSchema(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "example_from_schema",
    "Generate a deterministic example instance that satisfies a JSON Schema, useful as a template or test fixture.",
    {
      schema: z.string().min(2).describe("The JSON Schema, as JSON text")
    },
    async (a) => {
      try {
        return text(await exampleFromSchema(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
