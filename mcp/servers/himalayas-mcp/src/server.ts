import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { HimalayasError, jobs } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "himalayas-mcp", version: "1.0.0" })

  server.tool(
    "jobs",
    "Recent remote job postings from Himalayas, with company, allowed locations, employment type, salary and apply link.",
    {
      limit: z.number().int().min(1).max(100).default(10).describe("Jobs per page, 1-100"),
      offset: z.number().int().min(0).default(0).describe("How many jobs to skip, for paging"),
    },
    async ({ limit, offset }) => {
      try {
        return text(await jobs(limit, offset))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
