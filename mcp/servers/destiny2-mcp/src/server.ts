import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchPlayer,
  getProfile,
  getCharacter,
  getMilestones,
  getManifest,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "destiny2-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_player",
    {
      title: "Search Destiny player",
      description: "Find a Destiny 2 player by display name across Bungie memberships.",
      inputSchema: z.object({
        displayName: z.string().describe("Bungie name, e.g. 'Guardian#1234' or partial"),
        membershipType: z.number().default(-1).describe("Membership type id, -1 searches all"),
      }),
      annotations: READ_ONLY,
    },
    async ({ displayName, membershipType }) => {
      try {
        return text(await searchPlayer(displayName, membershipType));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_profile",
    {
      title: "Get Destiny profile",
      description: "Get a Destiny 2 profile: characters, inventory, progression. Components default to profile + characters.",
      inputSchema: z.object({
        membershipType: z.number().describe("Membership type id"),
        membershipId: z.string().describe("Membership id"),
        components: z.string().default("100,200").describe("Component types, e.g. '100,200,202'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ membershipType, membershipId, components }) => {
      try {
        return text(await getProfile(membershipType, membershipId, components));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_character",
    {
      title: "Get Destiny character",
      description: "Get one Destiny 2 character: equipment, stats, progression, loadouts.",
      inputSchema: z.object({
        membershipType: z.number().describe("Membership type id"),
        membershipId: z.string().describe("Membership id"),
        characterId: z.string().describe("Character id"),
        components: z.string().default("200,205,300").describe("Component types"),
      }),
      annotations: READ_ONLY,
    },
    async ({ membershipType, membershipId, characterId, components }) => {
      try {
        return text(await getCharacter(membershipType, membershipId, characterId, components));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_milestones",
    {
      title: "Get milestones",
      description: "Current Destiny 2 public milestones: Nightfall, raids, seasonal events with modifiers and rewards.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMilestones());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_manifest",
    {
      title: "Get content manifest",
      description: "Destiny 2 manifest index: version plus content paths for definitions (items, activities, lore).",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getManifest());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
