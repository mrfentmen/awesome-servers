import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { estimateAge, estimateGender } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "name-age-mcp", version: "1.0.0" })
  server.registerTool(
    "estimate_age",
    {
      title: "Estimate age",
      description: "Estimate the typical age for a first name.",
      inputSchema: z.object( { name: z.string().describe("First name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await estimateAge(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "estimate_gender",
    {
      title: "Estimate gender",
      description: "Estimate the gender for a first name.",
      inputSchema: z.object( { name: z.string().describe("First name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await estimateGender(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "famous_namesakes",
    {
      title: "Famous namesakes",
      description: "Notable people, works and places that share a name, straight from Wikidata, with each item's short description.",
      inputSchema: z.object( { name: z.string().max(120).describe("Name to look up."), limit: z.number().int().min(1).max(25).default(8) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: famous_namesakes ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_name_age_famous_namesakes", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "namesake_lifespan",
    {
      title: "Namesake lifespan",
      description: "Birth date, death date and age at death of the top Wikidata match for a name.",
      inputSchema: z.object( { name: z.string().max(120).describe("Name to look up.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: namesake_lifespan ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_name_age_namesake_lifespan", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
