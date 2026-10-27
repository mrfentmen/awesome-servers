import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { findInText, LEXICON, lookupExact, searchLexicon } from "./lexicon.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function formatEntry(e: {
  term: string
  meaning: string
  origin: string
  example: string
  vibe: string
}): string {
  return (
    `**${e.term}** — ${e.meaning}\n` +
    `Origin: ${e.origin}\n` +
    `Example: "${e.example}"\n` +
    `Vibe: ${e.vibe}`
  )
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "brainrot-mcp",
    version: "1.0.0",
  })

  server.tool(
    "decode_term",
    "Look up a single slang / brainrot / niche internet term. " +
      "Fully offline. Returns meaning, origin, example, and vibe.",
    { term: z.string().describe("The term to decode, e.g. 'rizz' or 'fanum tax'") },
    async ({ term }) => {
      const entry = lookupExact(term) ?? searchLexicon(term)[0]
      if (!entry) {
        return text(
          `"${term}" isn't in the lexicon yet. Try search_terms for partial matches.`
        )
      }
      return text(formatEntry(entry))
    }
  )

  server.tool(
    "search_terms",
    "Fuzzy-search the lexicon by term, meaning, or vibe.",
    {
      query: z.string().describe("Search text, e.g. 'praise' or 'underground rap'"),
    },
    async ({ query }) => {
      const hits = searchLexicon(query)
      if (hits.length === 0) {
        return text(`Nothing in the lexicon matches "${query}".`)
      }
      return text(
        `Matches for "${query}" (${hits.length}):\n` +
          hits.map((h) => formatEntry(h)).join("\n\n")
      )
    }
  )

  server.tool(
    "decode_text",
    "Scan a block of text and decode every known slang term in it. " +
      "Great for captions, tweets, or comments you don't fully get.",
    { text: z.string().describe("The text to scan, e.g. a caption or comment") },
    async ({ text: input }) => {
      const hits = findInText(input)
      if (hits.length === 0) {
        return text("No known slang terms found in that text.")
      }
      return text(
        `Found ${hits.length} term(s):\n\n` + hits.map(formatEntry).join("\n\n")
      )
    }
  )

  server.tool(
    "random_term",
    "Return a random term from the lexicon — good for expanding your brainrot.",
    {},
    async () => {
      const entry = LEXICON[Math.floor(Math.random() * LEXICON.length)]
      return text(formatEntry(entry))
    }
  )

  server.tool(
    "lexicon_stats",
    "Get stats about the lexicon: term count and vibe breakdown.",
    {},
    async () => {
      const vibes = new Map<string, number>()
      for (const e of LEXICON) {
        vibes.set(e.vibe, (vibes.get(e.vibe) ?? 0) + 1)
      }
      const breakdown = [...vibes.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([v, n]) => `• ${v}: ${n}`)
        .join("\n")
      return text(
        `Lexicon holds ${LEXICON.length} terms.\nVibe breakdown:\n${breakdown}`
      )
    }
  )

  return server
}
