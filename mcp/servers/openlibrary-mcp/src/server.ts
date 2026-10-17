import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { authorWorks, errorMessage, getAuthor, getEdition, getWork, searchBooks, searchByAuthor, searchBySubject, editionByIsbn, workEditions, subjectOverview, searchFacets } from "./api.js"
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "edition_by_isbn",
    {
      title: "Look up an ISBN",
      description:
        "Resolve an ISBN straight to its edition record - title, publisher, pages, language and cover - after checking the ISBN's own check digit, so a typo is caught before the request.",
      inputSchema: z.object({
        isbn: z.string().describe("ISBN-10 or ISBN-13, hyphens allowed, e.g. 9780140328721"),
      }),
      annotations: READ_ONLY,
    },
    async ({ isbn }) => {
      try {
        return text(await editionByIsbn({ isbn }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "work_editions",
    {
      title: "Work editions",
      description:
        "Every printing of a work that Open Library holds: edition count, publication-year range, publishers, languages and the edition keys to drill into.",
      inputSchema: z.object({
        workId: z.string().describe("Work id or path, e.g. OL27448W"),
        limit: z.number().describe("Editions to list, 1-50. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ workId, limit }) => {
      try {
        return text(await workEditions({ workId, limit }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "subject_overview",
    {
      title: "Subject overview",
      description:
        "A subject as an entity rather than a search: how many works it holds and the works Open Library ranks first, with authors and first publication years.",
      inputSchema: z.object({
        subject: z.string().describe("Subject name or slug, e.g. 'science fiction' or 'cooking'"),
        limit: z.number().describe("Works to list, 1-25. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ subject, limit }) => {
      try {
        return text(await subjectOverview({ subject, limit }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "read_availability",
    {
      title: "Read availability",
      description: "Whether a book can be read today: every edition Open Library indexes for an ISBN with its preview status, the Internet Archive scan behind it, available formats, page count, publishers, subjects and cover, and an honest note about what restricted preview does and does not mean.",
      inputSchema: z.object({ isbn: z.string().describe("ISBN-10 or ISBN-13, dashes are fine.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement availability locally (paywall removed)
    try { return textError("Not yet implemented: availability") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "scanned_copy_report",
    {
      title: "Scanned copy report",
      description: "The Internet Archive's own record of a scanned book: whether it is print-disabled, its lending status, which library scanned it and when, the physical description and subjects, and the file inventory including whether searchable OCR text and encrypted lending copies are present.",
      inputSchema: z.object({ ocaid: z.string().describe("Internet Archive item id, e.g. fantasticmrfoxpu00roal. read_availability lists them.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement report locally (paywall removed)
    try { return textError("Not yet implemented: report") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "search_facets",
    {
      title: "Search facets",
      description: "Aggregate a real Open Library search: how many works match, which publishers, languages and subjects dominate the results, the most frequent authors, and a decade histogram of when those works first appeared.",
      inputSchema: z.object({
        query: z.string().describe("What to search for, e.g. 'time travel'."),
        limit: z.number().describe("How many results to aggregate, 5-100.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchFacets(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
