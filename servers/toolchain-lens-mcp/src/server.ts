import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { explain, format } from "./lens.js"
import { checkToolchainDeclarations, reproducibilityGapMatrix } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "toolchain-lens-mcp", version: "1.0.0" })
  server.registerTool(
    "explain_toolchain",
    {
      title: "Explain toolchain",
      description: "Explain local reproducibility signals and contradictions without returning exact versions, dependency names, or secret values.",
      inputSchema: z.object(
    { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      try { return text(format(await explain(project))) } catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "reproducibility_gap_matrix",
    {
      title: "Reproducibility gap matrix",
      description: "Cross local manifests, lockfiles, container files and CI files into a capability by ecosystem matrix (pinned runtime, lockfile, frozen install, container base, CI runtime setup, integrity checksums), report cell coverage and the ranked gaps. Versions, dependency names and filenames are never returned.",
      inputSchema: z.object(
    { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: reproducibility_gap_matrix ----
    const paywallMessage = await premiumRequired("reproducibility_gap_matrix")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await reproducibilityGapMatrix(args)) } catch (error) { return errorText(error) }
  }
  )

  server.registerTool(
    "check_toolchain_declarations",
    {
      title: "Check toolchain declarations",
      description: "Check manifest and CI documents you supply for contradictions: a runtime that names several majors inside one document or disagrees across documents, and package-manager declarations that do not match the lockfile signals present. Document text is never echoed.",
      inputSchema: z.object( { documents: z.array(z.string().max(200000)).min(1).max(40).describe("Manifest or CI document contents, up to 40 entries of 200,000 characters each.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await checkToolchainDeclarations(args)) } catch (error) { return errorText(error) }
  }
  )

  return server
}
