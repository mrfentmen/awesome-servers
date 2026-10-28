import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { randomUsers, usersByGender, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "randomuser-mcp", version: "1.0.1" })

  server.tool(
    "random_users",
    "Generate fake users, optionally from one nationality.",
    {
      count: z.number().int().min(1).max(20).default(3).describe("Users to generate"),
      nat: z.string().optional().describe('Nationality code, e.g. "us", "gb", "de", "jp"')
    },
    async (a) => {
      try {
        return text(await randomUsers(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "users_by_gender",
    "Generate fake users of one gender, optionally from one nationality.",
    {
      gender: z.enum(["male", "female"]).describe("Gender to generate"),
      count: z.number().int().min(1).max(20).default(3).describe("Users to generate"),
      nat: z.string().optional().describe("Nationality code")
    },
    async (a) => {
      try {
        return text(await usersByGender(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
