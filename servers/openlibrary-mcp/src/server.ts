import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  authorWorks,
  errorMessage,
  getAuthor,
  getEdition,
  getWork,
  searchBooks,
  searchByAuthor,
  searchBySubject,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "openlibrary-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_books",
    {
      title: "Search books",
      description: "Search Open Library by title, author or free text. Returns authors, first publish year and cover links.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'dune', 'the hobbit tolkien'"),
        limit: z.number().int().min(1).max(25).default(10).describe("How many results to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchBooks(query, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_by_author",
    {
      title: "Search by author",
      description: "Find books by an author name across the whole Open Library catalog.",
      inputSchema: z.object({
        author: z.string().describe("Author name, e.g. 'Ursula K. Le Guin'"),
        limit: z.number().int().min(1).max(25).default(10).describe("How many results to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ author, limit }) => {
      try {
        return text(await searchByAuthor(author, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_by_subject",
    {
      title: "Search by subject",
      description: "Browse a subject or genre, e.g. 'science_fiction', 'cooking', 'biography'.",
      inputSchema: z.object({
        subject: z.string().describe("Subject tag, e.g. 'science_fiction'"),
        limit: z.number().int().min(1).max(25).default(10).describe("How many results to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ subject, limit }) => {
      try {
        return text(await searchBySubject(subject, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_work",
    {
      title: "Get work",
      description: "Work details by ID (OL123W): description, subjects, first publish date and cover.",
      inputSchema: z.object({
        work_id: z.string().describe("Open Library work ID, e.g. 'OL893415W' or '/works/OL893415W'."),
      }),
      annotations: READ_ONLY,
    },
    async ({ work_id }) => {
      try {
        return text(await getWork(work_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_edition",
    {
      title: "Get edition",
      description: "Edition details by ID (OL123M): publisher, page count, ISBNs and cover.",
      inputSchema: z.object({
        edition_id: z.string().describe("Open Library edition ID, e.g. 'OL7353617M'."),
      }),
      annotations: READ_ONLY,
    },
    async ({ edition_id }) => {
      try {
        return text(await getEdition(edition_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_author",
    {
      title: "Get author",
      description: "Author details by ID (OL123A): birth/death dates, alternate names, bio and links.",
      inputSchema: z.object({
        author_id: z.string().describe("Open Library author ID, e.g. 'OL79034A' or '/authors/OL79034A'."),
      }),
      annotations: READ_ONLY,
    },
    async ({ author_id }) => {
      try {
        return text(await getAuthor(author_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "author_works",
    {
      title: "Author works",
      description: "List the works credited to an author ID, with publication years.",
      inputSchema: z.object({
        author_id: z.string().describe("Open Library author ID, e.g. 'OL79034A'."),
        limit: z.number().int().min(1).max(50).default(20).describe("How many works to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ author_id, limit }) => {
      try {
        return text(await authorWorks(author_id, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
