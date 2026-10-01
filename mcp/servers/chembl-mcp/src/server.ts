import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { molecule, search, moleculeMechanism, chemblRelease } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "chembl-mcp", version: "1.0.0" })
  server.registerTool(
    "molecule",
    {
      title: "Molecule",
      description: "Details for a ChEMBL molecule.",
      inputSchema: z.object( { id: z.string().describe("Molecule ID like CHEMBL25.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await molecule(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search molecules by name.",
      inputSchema: z.object( { query: z.string().describe("Name fragment."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "molecule_activities",
    {
      title: "Molecule activities",
      description: "Bioactivity records for a ChEMBL molecule: measured values per target, with pChEMBL scores and any data warnings.",
      inputSchema: z.object( { molecule_id: z.string().describe("Molecule ID, e.g. CHEMBL25."), type: z.string().describe("Standard type, e.g. IC50 or Ki.").optional(), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: molecule_activities ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_chembl_molecule_activities", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "molecule_mechanism",
    {
      title: "Molecule mechanism",
      description: "Mechanism of action for a ChEMBL molecule: what it acts on, how, and the trial phase it reached.",
      inputSchema: z.object( { molecule_id: z.string().describe("Molecule ID, e.g. CHEMBL25.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await moleculeMechanism(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "molecule_indications",
    {
      title: "Molecule indications",
      description: "The diseases a ChEMBL molecule has been trialed for, with MeSH terms and the phase reached per indication.",
      inputSchema: z.object( { molecule_id: z.string().describe("Molecule ID, e.g. CHEMBL25."), limit: z.number().describe("Max indications.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: molecule_indications ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_chembl_molecule_indications", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "chembl_release",
    {
      title: "ChEMBL release",
      description: "Which ChEMBL release the service is serving and how large it is: activities, compounds, targets, assays.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await chemblRelease(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
