import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { OstiError, record, search } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof OstiError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "osti-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search US Department of Energy research in OSTI: journal articles, technical reports, conference papers, patents and datasets.",
    {
      q: z.string().optional().describe('Words to look for, e.g. "solar desalination". Omit it when you only use filters.'),
      limit: z.number().int().min(1).max(100).default(10).describe("Records per page, 1-100"),
      page: z.number().int().min(1).default(1).describe("Page number, starting at 1"),
      title: z.string().optional().describe("Only records whose title contains these words"),
      author: z.string().optional().describe('Author name, e.g. "Smith" or "Smith, John"'),
      subject: z.string().optional().describe('Subject term, e.g. "machine learning"'),
      productType: z.string().optional().describe('Record type, e.g. "Journal Article", "Technical Report", "Conference", "Patent"'),
      researchOrg: z.string().optional().describe('Research organisation, e.g. "Oak Ridge"'),
      sponsorOrg: z.string().optional().describe('Sponsoring office, e.g. "USDOE"'),
      dateStart: z.string().optional().describe('Earliest publication year, e.g. "2020" or "2020-06-01"'),
      dateEnd: z.string().optional().describe('Latest publication year, e.g. "2024" or "2024-12-31"'),
    },
    async (args) => {
      try {
        return text(
          await search({
            q: args.q,
            limit: args.limit,
            page: args.page,
            title: args.title,
            author: args.author,
            subject: args.subject,
            productType: args.productType,
            researchOrg: args.researchOrg,
            sponsorOrg: args.sponsorOrg,
            dateStart: args.dateStart,
            dateEnd: args.dateEnd,
          })
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "record",
    "One OSTI record by id: authors, journal, DOI, sponsors, subjects, description and full-text links.",
    { id: z.string().min(3).describe('OSTI id, e.g. "3376901", or a full osti.gov/biblio/... URL') },
    async ({ id }) => {
      try {
        return text(await record(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
