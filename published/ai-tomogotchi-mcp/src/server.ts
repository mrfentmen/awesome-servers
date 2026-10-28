// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as Tomogotchi from "./tomogotchi.js"

export function createServer(): McpServer {
  const server = new McpServer({ name: "ai-tomogotchi-mcp", version: "1.0.0" })

  server.tool(
    "create_pet",
    "Create a new AI Tomogotchi pet.",
    {
      name: z.string().describe("Name for your pet"),
    },
    async (args: any) => {
      try {
        const state = await Tomogotchi.createPet(args.name)
        return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool("feed_pet", "Feed your AI Tomogotchi pet.", {}, async () => {
    try {
      const state = await Tomogotchi.feedPet()
      return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("play_with_pet", "Play with your AI Tomogotchi pet.", {}, async () => {
    try {
      const state = await Tomogotchi.playWithPet()
      return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("rest_pet", "Let your AI Tomogotchi pet rest.", {}, async () => {
    try {
      const state = await Tomogotchi.restPet()
      return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("heal_pet", "Heal your AI Tomogotchi pet.", {}, async () => {
    try {
      const state = await Tomogotchi.healPet()
      return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("check_pet", "Check your AI Tomogotchi pet's status.", {}, async () => {
    try {
      const state = await Tomogotchi.checkPet()
      return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("age_pet", "Age your AI Tomogotchi pet (decreases stats).", {}, async () => {
    try {
      const state = await Tomogotchi.agePet()
      return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("delete_pet", "Delete your AI Tomogotchi pet.", {}, async () => {
    try {
      const result = await Tomogotchi.deletePet()
      return { content: [{ type: "text", text: `Pet deleted: ${result}` }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  return server
}
