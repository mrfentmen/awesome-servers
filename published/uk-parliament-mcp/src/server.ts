import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { billDetail, memberDetail, searchBills, searchMembers, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "uk-parliament-mcp", version: "1.0.1" })

  server.tool(
    "search_members",
    "Find MPs or Lords by name.",
    {
      name: z.string().min(2).describe("Name text, e.g. smith or starmer"),
      limit: z.number().int().min(1).max(20).default(5).describe("Members to return")
    },
    async (a) => {
      try {
        return text(await searchMembers(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "member_detail",
    "One member by id, with party, house and constituency.",
    {
      memberId: z.number().int().min(1).describe("Parliament member id, e.g. 4514")
    },
    async (a) => {
      try {
        return text(await memberDetail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_bills",
    "Search bills before Parliament by title.",
    {
      term: z.string().min(3).describe("Words in the bill title, e.g. climate"),
      limit: z.number().int().min(1).max(20).default(5).describe("Bills to return")
    },
    async (a) => {
      try {
        return text(await searchBills(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "bill_detail",
    "One bill by id, with sponsors, long title and stage history.",
    {
      billId: z.number().int().min(1).describe("Bill id, e.g. 2772")
    },
    async (a) => {
      try {
        return text(await billDetail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
