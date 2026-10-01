import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search, technique } from "./free-api.js"

import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mitre-attack-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search techniques by keyword.",
      inputSchema: z.object( { query: z.string().describe("Keyword to search, for example phishing or persistence."), limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "technique",
    {
      title: "Technique",
      description: "Get one technique by ID.",
      inputSchema: z.object( { id: z.string().describe("Technique ID, for example T1059.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await technique(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "group_list",
    {
      title: "Group list",
      description: "The intrusion sets and threat groups MITRE ATT&CK tracks, with aliases and descriptions, which a technique search never returns.",
      inputSchema: z.object( { query: z.string().describe("Filter by group name or alias.").optional(), limit: z.number().describe("Max groups.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: group_list ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_mitre_attack_group_list", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "software_list",
    {
      title: "Software list",
      description: "The malware and tooling entries in the MITRE ATT&CK STIX bundle, with aliases, platforms and labels, which a technique search never returns.",
      inputSchema: z.object( { query: z.string().describe("Filter by name, alias or description.").optional(), limit: z.number().describe("Max entries.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: software_list ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_mitre_attack_software_list", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "tactic_list",
    {
      title: "Tactic list",
      description: "ATT&CK's own tactic list, read from the x-mitre-tactic objects in the enterprise STIX bundle, which gives the framework a technique search does not show.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: tactic_list ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_mitre_attack_tactic_list", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "technique_mitigations",
    {
      title: "Technique mitigations",
      description: "Resolve active ATT&CK mitigation relationships for a technique, with mitigation IDs and technique-specific defensive guidance.",
      inputSchema: z.object({ id: z.string().describe("Technique ID, for example T1059."), limit: z.number().optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: technique_mitigations ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_mitre_attack_technique_mitigations", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
