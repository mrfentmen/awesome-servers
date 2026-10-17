import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, spl, drugNames } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "dailymed-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search drug labels by name.",
      inputSchema: z.object( { drugName: z.string().describe("Drug name like aspirin."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "spl",
    {
      title: "Spl",
      description: "One structured product label by set ID.",
      inputSchema: z.object( { setId: z.string().describe("DailyMed set ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await spl(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "label_packaging",
    {
      title: "Label packaging",
      description: "Package forms, NDC codes, active ingredient strengths and product codes for a DailyMed label.",
      inputSchema: z.object( { setId: z.string().describe("DailyMed set ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement packaging locally (paywall removed)
    try { return textError("Not yet implemented: packaging") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "label_history",
    {
      title: "Label history",
      description: "Every published version of a DailyMed label, newest version first, with its version number and date.",
      inputSchema: z.object( { setId: z.string().describe("DailyMed set ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement history locally (paywall removed)
    try { return textError("Not yet implemented: history") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "drug_names",
    {
      title: "Drug names",
      description: "Look up generic and brand drug names in DailyMed, useful for finding the exact name before searching labels.",
      inputSchema: z.object( { query: z.string().describe("Part of a drug name."), limit: z.number().describe("How many, 1-25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await drugNames(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
