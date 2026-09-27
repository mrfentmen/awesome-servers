import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { doiLookup, funderLookup, funders, journalLookup, journals, licenses, memberLookup, members, workTypes } from "./api.js"
import { searchWorks } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "crossref-mcp", version: "1.0.0" })
  server.registerTool(
    "search_works",
    {
      title: "Search works",
      description: "Search scholarly works.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchWorks(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "doi_lookup",
    {
      title: "Doi lookup",
      description: "Resolve a DOI to its metadata.",
      inputSchema: z.object( { doi: z.string().describe("Digital Object Identifier.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await doiLookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "journals",
    {
      title: "Search journals",
      description: "Search scholarly journals.",
      inputSchema: z.object( { query: z.string().describe("Search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await journals(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "journal_lookup",
    {
      title: "Journal lookup",
      description: "Journal metadata by ISSN.",
      inputSchema: z.object( { issn: z.string().describe("ISSN like 0028-0836.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await journalLookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "funders",
    {
      title: "Search funders",
      description: "Search research funders.",
      inputSchema: z.object( { query: z.string().describe("Search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await funders(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "funder_lookup",
    {
      title: "Funder lookup",
      description: "Funder metadata by id.",
      inputSchema: z.object( { id: z.string().describe("Funder id like 100000001.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await funderLookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "members",
    {
      title: "Search members",
      description: "Search Crossref members (publishers).",
      inputSchema: z.object( { query: z.string().describe("Search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await members(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "member_lookup",
    {
      title: "Member lookup",
      description: "Member metadata and DOI counts.",
      inputSchema: z.object( { id: z.string().describe("Member id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await memberLookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "work_types",
    {
      title: "Work types",
      description: "Crossref work type vocabulary.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await workTypes()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "licenses",
    {
      title: "Licenses",
      description: "License URLs with DOI counts.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await licenses()) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
