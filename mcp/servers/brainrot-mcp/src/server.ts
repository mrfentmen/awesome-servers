import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { findInText, LEXICON, lookupExact, searchLexicon } from "./lexicon.js"
import { originTimeline, relatedTerms, similarTerms } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorMessage = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

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

  server.registerTool(
    "decode_term",
    {
      title: "Decode term",
      description: "Look up a single slang / brainrot / niche internet term. " +
      "Fully offline. Returns meaning, origin, example, and vibe.",
      inputSchema: z.object(
    { term: z.string().describe("The term to decode, e.g. 'rizz' or 'fanum tax'") }),
      annotations: READ_ONLY,
    },
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

  server.registerTool(
    "search_terms",
    {
      title: "Search terms",
      description: "Fuzzy-search the lexicon by term, meaning, or vibe.",
      inputSchema: z.object(
    {
      query: z.string().describe("Search text, e.g. 'praise' or 'underground rap'"),
    }),
      annotations: READ_ONLY,
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

  server.registerTool(
    "decode_text",
    {
      title: "Decode text",
      description: "Scan a block of text and decode every known slang term in it. " +
      "Great for captions, tweets, or comments you don't fully get.",
      inputSchema: z.object(
    { text: z.string().describe("The text to scan, e.g. a caption or comment") }),
      annotations: READ_ONLY,
    },
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

  server.registerTool(
    "random_term",
    {
      title: "Random term",
      description: "Return a random term from the lexicon — good for expanding your brainrot.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      const entry = LEXICON[Math.floor(Math.random() * LEXICON.length)]
      return text(formatEntry(entry))
    }
  )

  server.registerTool(
    "lexicon_stats",
    {
      title: "Lexicon stats",
      description: "Get stats about the lexicon: term count and vibe breakdown.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
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

  server.registerTool(
    "origin_timeline",
    {
      title: "Origin timeline",
      description: "When this vocabulary arrived, read out of the lexicon itself: how many entries name a specific year, how many only name a decade and how many name no date at all, the earliest and most recent term, and every dated term grouped by year. The lexicon_stats tool only counts terms and tallies vibes; no existing tool looks at the origin field as data.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try { return text(await originTimeline()) } catch (error) { return textError(`Error: ${error instanceof Error ? error.message : String(error)}`) }
    }
  )

  server.registerTool(
    "related_terms",
    {
      title: "Related terms",
      description: "Map one lexicon term's real connections: which other terms its own entry names in its meaning, origin or example, which entries name it in return, and which entries share a vibe word, with one way links called out as such. The search_terms tool is a substring filter over three fields and has no notion of direction or of who mentions whom.",
      inputSchema: z.object({ term: z.string().describe("Term to map, e.g. 'skibidi'") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: related_terms ----
      const paywallMessage = await premiumRequired("related_terms")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await relatedTerms({ term: args.term })) } catch (e) { return textError(errorMessage(e)) }
    }
  )
  server.registerTool(
    "similar_terms",
    {
      title: "Similar terms",
      description: "Rank the other lexicon entries by how much wording they share with this one, with the shared words named. search_terms is a substring filter and related_terms is an exact-mention graph; neither ranks entries by shared vocabulary.",
      inputSchema: z.object( { term: z.string().describe("A lexicon term, e.g. skibidi."), limit: z.number().int().describe("How many similar terms to rank.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: similar_terms ----
    const paywallMessage = await premiumRequired("similar_terms")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await similarTerms(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
