import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { analyze, format } from "./contract.js"
import { contractSummary, contractDiff } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "env-contract-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_contract",
    {
      title: "Inspect contract",
      description: "Inspect a local project for declared and referenced environment variable names without reading values.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).describe("Local project directory; no network URLs") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => { try { return text(format(await analyze(project))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "contract_summary",
    {
      title: "Contract summary",
      description: "Read the environment contract of a local project as a report rather than a JSON dump: how many files were read, how many declare names and how many reference them, the declared, referenced, missing and unused counts, the name prefixes that show which subsystem each variable belongs to, and the longest and shortest names.",
      inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no network URLs") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      try { return text(await contractSummary({ project })) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "contract_diff",
    {
      title: "Contract diff",
      description: "Compare the environment contract of two local checkouts: which names were newly declared, which were dropped, which kept their declaration, which lost or gained a reference, and which undeclared-but-referenced gaps were closed or opened. The inspect_contract tool only ever looks at one directory at a time.",
      inputSchema: z.object({
        before: z.string().min(1).max(1000).describe("Earlier local project directory"),
        after: z.string().min(1).max(1000).describe("Later local project directory"),
      }),
      annotations: READ_ONLY,
    },
    async ({ before, after }) => {
      // ---- paywall: contract_diff ----
      const paywallMessage = await premiumRequired("contract_diff")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await contractDiff({ before, after })) } catch (error) { return errorText(error) }
    }
  )
  return server
}
