import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  breachCatalog,
  breachDetail,
  breachStats,
  dataClasses,
  errorMessage,
  passwordAudit,
  passwordExposure,
  recentBreaches,
} from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "hibp-mcp", version: "1.1.0" })

  server.registerTool(
    "breach_catalog",
    {
      title: "Breach catalogue",
      description: "Search the Have I Been Pwned catalogue of disclosed breaches, largest first, filtered by domain or year.",
      inputSchema: z.object({
        domain: z.string().describe("Part of a domain to match, for example adobe or linkedin.com.").optional(),
        year: z.number().describe("Only breaches that happened in this year, for example 2024.").optional(),
        limit: z.number().describe("How many breaches to show, 1-100. Defaults to 15.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await breachCatalog(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "breach_detail",
    {
      title: "Breach detail",
      description: "Full record for one breach by its catalogue name, including the account count, data classes and description.",
      inputSchema: z.object({
        name: z.string().describe("Exact breach name, for example Adobe or LinkedIn.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await breachDetail(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "recent_breaches",
    {
      title: "Recent breaches",
      description: "Breaches most recently added to the catalogue, newest first, optionally limited to the last N days.",
      inputSchema: z.object({
        days: z.number().describe("Only breaches added in the last N days, for example 90. Omit for all.").optional(),
        limit: z.number().describe("How many breaches to show, 1-100. Defaults to 15.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await recentBreaches(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "breach_stats",
    {
      title: "Breach statistics",
      description: "Aggregate picture of the breach catalogue: accounts exposed, verification rate, breaches per year and the data types leaked most.",
      inputSchema: z.object({
        year: z.number().describe("Restrict the statistics to breaches dated in this year, for example 2023.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await breachStats(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "data_classes",
    {
      title: "Data classes",
      description: "Which kinds of personal data leak most often, ranked by how many breaches exposed each type.",
      inputSchema: z.object({
        limit: z.number().describe("How many data classes to rank, 1-165. Defaults to 25.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await dataClasses(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "password_exposure",
    {
      title: "Password exposure",
      description: "Check one password against known breach dumps. Uses k-anonymity, so the password is never transmitted.",
      inputSchema: z.object({
        password: z.string().describe("The password to check. Hashed locally; only 5 hash characters are sent.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await passwordExposure(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "password_audit",
    {
      title: "Audit passwords",
      description: "Check up to 10 passwords at once and report which have already appeared in a breach.",
      inputSchema: z.object({
        passwords: z.array(z.string()).describe("Up to 10 passwords to check in one call.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await passwordAudit(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
