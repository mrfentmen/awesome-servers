import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  webSearch,
  newsSearch,
  imageSearch,
  videoSearch,
  suggestQueries,
  spellcheck,
  listGoggles,
  faqSearch,
  discussionSearch,
  localizedSearch,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "brave-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "web_search",
    {
      title: "Web search",
      description: "Web results with titles, URLs and snippets.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        count: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, count }) => {
      try {
        return text(await webSearch(query, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "news_search",
    {
      title: "News search",
      description: "Recent news articles matching a query.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        count: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, count }) => {
      try {
        return text(await newsSearch(query, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "image_search",
    {
      title: "Image search",
      description: "Image results.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        count: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, count }) => {
      try {
        return text(await imageSearch(query, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "video_search",
    {
      title: "Video search",
      description: "Video results.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        count: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, count }) => {
      try {
        return text(await videoSearch(query, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "suggest_queries",
    {
      title: "Suggest",
      description: "Query suggestions.",
      inputSchema: z.object({
        query: z.string().describe("Partial query.")
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await suggestQueries(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "spellcheck",
    {
      title: "Spellcheck",
      description: "Spelling fixes.",
      inputSchema: z.object({
        query: z.string().describe("Text to check.")
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await spellcheck(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_goggles",
    {
      title: "List goggles",
      description: "Custom search goggles.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listGoggles());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "faq_search",
    {
      title: "FAQ search",
      description: "FAQ-style answers.",
      inputSchema: z.object({
        query: z.string().describe("Question."),
        count: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, count }) => {
      try {
        return text(await faqSearch(query, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "discussion_search",
    {
      title: "Discussions",
      description: "Forum threads.",
      inputSchema: z.object({
        query: z.string().describe("Topic."),
        count: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, count }) => {
      try {
        return text(await discussionSearch(query, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "localized_search",
    {
      title: "Local search",
      description: "Country-scoped results.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        country: z.string().describe("Country code, e.g. DE."),
        count: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, country, count }) => {
      try {
        return text(await localizedSearch(query, country, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}