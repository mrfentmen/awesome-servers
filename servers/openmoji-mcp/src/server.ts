import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  emojiStats,
  emojisInGroup,
  errorMessage,
  getEmoji,
  listGroups,
  listSubgroups,
  randomEmoji,
  searchEmoji,
} from "./api.js"

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

  return server
}
