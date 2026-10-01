import { contractSummary, contractDiff } from "./api.js"
import { premiumTool } from "./gateway.js"
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { analyze, format } from "./contract.js"

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
      try { return text(await contractDiff({ before, after })) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "node_runtime_lifecycle",
    {
      title: "Node runtime lifecycle",
      description: "Look up Node.js runtime release cycles, current patch releases, LTS dates and end-of-life dates to assess deployment runtime requirements. Source endoflife.date.",
      inputSchema: z.object({ cycle: z.string().max(20).optional(), limit: z.number().int().min(1).max(30).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: node_runtime_lifecycle ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_env_contract_node_runtime_lifecycle", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "environment_dns_records",
    {
      title: "Environment dns records",
      description: "Resolve a deployment hostname through Google Public DNS and report records, TTLs and authentication flags. Defaults to example.com A; does not read environment values.",
      inputSchema: z.object({ hostname: z.string().max(253).optional(), type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "CAA"]).optional(), limit: z.number().int().min(1).max(30).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: environment_dns_records ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_env_contract_environment_dns_records", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
