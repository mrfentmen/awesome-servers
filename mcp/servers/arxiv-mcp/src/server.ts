import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ArxivError, latestInCategory, paperById, papersByAuthor, searchInCategory, searchPapers } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof ArxivError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const maxArg = z.number().int().min(1).max(25).default(8).describe("How many papers to return")

export function createServer(): McpServer {
  const server = new McpServer({ name: "arxiv-mcp", version: "1.0.0" })

  server.tool(
    "search_papers",
    "Search arXiv. Free text searches everything; field prefixes work (ti:, au:, abs:, cat:).",
    {
      query: z.string().min(2).describe('Query, e.g. "diffusion models" or "ti:transformer" or "au:lecun"'),
      max_results: maxArg,
      newest_first: z.boolean().default(false).describe("Sort by submission date instead of relevance"),
    },
    async ({ query, max_results, newest_first }) => {
      try {
        return text(await searchPapers(query, max_results, newest_first))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "paper_by_id",
    "One arXiv paper by id, with the full abstract.",
    { arxiv_id: z.string().min(4).describe("arXiv id, e.g. 1706.03762 or 1706.03762v7") },
    async ({ arxiv_id }) => {
      try {
        return text(await paperById(arxiv_id))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "papers_by_author",
    "Recent arXiv papers attributed to an author name.",
    {
      author: z.string().min(2).describe('Author name, e.g. "Yann LeCun"'),
      max_results: maxArg,
      newest_first: z.boolean().default(true).describe("Sort by submission date"),
    },
    async ({ author, max_results, newest_first }) => {
      try {
        return text(await papersByAuthor(author, max_results, newest_first))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "latest_in_category",
    "Newest submissions in one arXiv category.",
    {
      category: z.string().min(2).describe('Category, e.g. "cs.AI", "math.NT", "hep-th"'),
      max_results: maxArg,
    },
    async ({ category, max_results }) => {
      try {
        return text(await latestInCategory(category, max_results))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_in_category",
    "Search a topic inside a single arXiv category.",
    {
      query: z.string().min(2).describe("Search terms"),
      category: z.string().min(2).describe('Category, e.g. "cs.LG"'),
      max_results: maxArg,
    },
    async ({ query, category, max_results }) => {
      try {
        return text(await searchInCategory(query, category, max_results))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
