import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { AnthologyError, bibtex, eventVolumes, findInVolume, paper, volumePapers } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof AnthologyError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const volumeArg = z.string().min(3).describe('Volume id, e.g. "2024.acl-long" or "v235" style ids are not used here')

export function createServer(): McpServer {
  const server = new McpServer({ name: "acl-anthology-mcp", version: "1.0.0" })

  server.tool(
    "paper",
    "One ACL Anthology paper: title, authors, venue, pages, DOI, PDF link and abstract.",
    { paper_id: z.string().min(4).describe('Anthology id, e.g. "2024.acl-long.1" or "P19-1001"') },
    async ({ paper_id }) => {
      try {
        return text(await paper(paper_id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "bibtex",
    "The Anthology's own BibTeX entry for one paper, ready to paste into a bibliography.",
    { paper_id: z.string().min(4).describe('Anthology id, e.g. "2024.acl-long.1"') },
    async ({ paper_id }) => {
      try {
        return text(await bibtex(paper_id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "volume_papers",
    "List the papers in one proceedings volume, paginated, with ids and links.",
    {
      volume_id: volumeArg,
      limit: z.number().int().min(1).max(100).default(20).describe("How many papers to return"),
      offset: z.number().int().min(0).default(0).describe("Skip this many papers"),
    },
    async ({ volume_id, limit, offset }) => {
      try {
        return text(await volumePapers(volume_id, limit, offset))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "find_in_volume",
    "Title search inside one volume — useful for finding a paper when you know the venue but not the id.",
    {
      volume_id: volumeArg,
      query: z.string().min(2).describe("Words to look for in paper titles"),
    },
    async ({ volume_id, query }) => {
      try {
        return text(await findInVolume(volume_id, query))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "event_volumes",
    "Every volume published for one event, e.g. all volumes of ACL 2024.",
    { event_id: z.string().min(3).describe('Event id, e.g. "acl-2024", "emnlp-2023", "naacl-2022"') },
    async ({ event_id }) => {
      try {
        return text(await eventVolumes(event_id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
