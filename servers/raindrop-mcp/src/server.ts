import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, user, collections, raindrops, linkPreview, bookLookup } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "raindrop-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "user",
    {
      title: "User",
      description: "The Raindrop account the token belongs to.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await user());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "collections",
    {
      title: "Collections",
      description: "Bookmark collections with counts and ids.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await collections());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "raindrops",
    {
      title: "Bookmarks",
      description: "Bookmarks in one collection, with tags and links.",
      inputSchema: z.object({
        collection_id: z.string().describe("Collection ID (0 = all).")
      }),
      annotations: READ_ONLY,
    },
    async ({ collection_id }) => {
      try {
        return text(await raindrops(collection_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "link_preview",
    {
      title: "Link preview",
      description:
        "What a link actually is before it is saved: the site's oEmbed card when it has one, otherwise its Open Graph and Twitter card tags, its title, canonical link and the HTTP status the link returns right now.",
      inputSchema: z.object({
        url: z.string().describe("URL to inspect, e.g. 'https://blog.rust-lang.org/2025/09/18/Rust-1.90.0/'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: link_preview ----
    const paywallMessage = await premiumRequired("link_preview")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await linkPreview(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "book_lookup",
    {
      title: "Book lookup",
      description:
        "What a book actually is, from Open Library: its description, first publication date, how many editions are catalogued, its subjects, its average rating and the ISBNs on file.",
      inputSchema: z.object({
        title: z.string().describe("Book title, e.g. 'The Dispossessed'"),
        author: z.string().describe("Author, to disambiguate.").optional(),
        limit: z.number().describe("Max matching works, 1-15. Defaults to 5.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: book_lookup ----
    const paywallMessage = await premiumRequired("book_lookup")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await bookLookup(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}