import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { emojiStats, emojisInGroup, errorMessage, getEmoji, listGroups, listSubgroups, randomEmoji, searchEmoji, svgLinks, skinToneVariants, compareEmoji, emojiLint } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const LIMIT = (max: number, fallback: number) =>
  z.number().int().min(1).max(max).default(fallback).describe(`How many to show (max ${max})`)

export function createServer(): McpServer {
  const server = new McpServer({
    name: "openmoji-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_emoji",
    {
      title: "Search emoji",
      description:
        "Search every OpenMoji emoji by annotation, tag, group or subgroup. Returns hexcode and SVG link.",
      inputSchema: z.object({
        query: z.string().describe("Keyword, e.g. 'cat', 'rocket', 'smiling'"),
        limit: LIMIT(50, 10),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchEmoji(query, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_emoji",
    {
      title: "Get emoji details",
      description: "Full record for one emoji: group, subgroup, tags and the official SVG link.",
      inputSchema: z.object({
        hexcode: z.string().describe("Hexcode, e.g. '1F431' or 'U+1F431'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ hexcode }) => {
      try {
        return text(await getEmoji(hexcode))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_groups",
    {
      title: "List groups",
      description: "The OpenMoji groups with how many emoji each contains.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await listGroups())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_subgroups",
    {
      title: "List subgroups",
      description: "Subgroups inside one group, with emoji counts.",
      inputSchema: z.object({
        group: z.string().describe("Group name, e.g. 'Animals & Nature'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ group }) => {
      try {
        return text(await listSubgroups(group))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "emojis_in_group",
    {
      title: "List emojis in a group",
      description: "Browse a group, optionally narrowed to one subgroup.",
      inputSchema: z.object({
        group: z.string().describe("Group name, e.g. 'Food & Drink'"),
        subgroup: z.string().describe("Optional subgroup filter, e.g. 'fruit'").optional(),
        limit: LIMIT(100, 25),
      }),
      annotations: READ_ONLY,
    },
    async ({ group, subgroup, limit }) => {
      try {
        return text(await emojisInGroup(group, subgroup, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "random_emoji",
    {
      title: "Random emoji",
      description: "Pick a random emoji, from the whole set or from one group.",
      inputSchema: z.object({
        group: z.string().describe("Optional group to pick from, e.g. 'Smileys & Emotion'").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ group }) => {
      try {
        return text(await randomEmoji(group))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "emoji_stats",
    {
      title: "Dataset statistics",
      description: "How big the OpenMoji set is right now: totals, groups, sequences and the largest group.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await emojiStats())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "svg_links",
    {
      title: "SVG file links",
      description:
        "The colour and black SVG files OpenMoji publishes for one emoji, each checked live so the URL, content type and file size are known before it is used.",
      inputSchema: z.object({
        hexcode: z.string().describe("Hexcode (1F44D), the emoji itself, or an annotation such as 'thumbs up'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ hexcode }) => {
      try {
        return text(await svgLinks({ hexcode }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "skin_tone_variants",
    {
      title: "Skin tone variants",
      description:
        "Every skin-tone variant OpenMoji publishes for an emoji, read from the dataset's own base links and labelled light through dark.",
      inputSchema: z.object({
        emoji: z.string().describe("Emoji character, hexcode or annotation, e.g. 'waving hand'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ emoji }) => {
      try {
        return text(await skinToneVariants({ emoji }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "compare_emoji",
    {
      title: "Compare emoji",
      description:
        "Compare two emoji on group, subgroup and tags with a tag-overlap score, to tell a near-duplicate apart from a genuinely different choice.",
      inputSchema: z.object({
        a: z.string().describe("First emoji, hexcode or annotation, e.g. 'thumbs up'"),
        b: z.string().describe("Second emoji, hexcode or annotation, e.g. '+1'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ a, b }) => {
      try {
        return text(await compareEmoji({ a, b }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "unicode_reference",
    {
      title: "Unicode reference",
      description: "The authoritative Unicode record for an emoji, straight from the official emoji list rather than the OpenMoji dataset: CLDR name, group and subgroup, the qualification status, the emoji version, and every officially registered skin tone variant with its own codepoints and version.",
      inputSchema: z.object({ hexcode: z.string().describe("Codepoints in hex, e.g. 1F44D, or a full sequence like 1F469 200D 1F4BB.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: unicode_reference ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openmoji_unicode_reference", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "unicode_version_census",
    {
      title: "Unicode version census",
      description: "What the official Unicode emoji list actually contains, aggregated: how many base emoji versus sequences, how many have registered skin tone variants, the qualification split, how many emoji each Unicode version added from oldest to newest, the newest additions by name, and the group and subgroup distribution.",
      inputSchema: z.object({ limit: z.number().describe("How many of the newest additions to name, 3-12.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: unicode_version_census ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openmoji_unicode_version_census", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "emoji_lint",
    {
      title: "Emoji lint",
      description: "Check a string for the emoji mistakes that break rendering, computed locally: bare skin tone modifiers with no base, lone regional indicators, text presentation selectors fighting your intent, missing variation selectors, ZWJ and keycap sequences, and the real grapheme count against the UTF-16 length you would store.",
      inputSchema: z.object({ input: z.string().describe("The string to check, e.g. a chat message or a UI label.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await emojiLint(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
