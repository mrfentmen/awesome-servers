import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { module, provider } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "terraform-registry-mcp", version: "1.0.0" })
  server.registerTool(
    "provider",
    {
      title: "Provider",
      description: "Details for a Terraform provider.",
      inputSchema: z.object( { namespace: z.string().describe("Namespace like hashicorp."), name: z.string().describe("Provider name like aws.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await provider(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "module",
    {
      title: "Module",
      description: "Details for a Terraform module.",
      inputSchema: z.object( { namespace: z.string().describe("Namespace."), name: z.string().describe("Module name."), provider: z.string().describe("Provider like aws.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await module(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "provider_versions",
    {
      title: "Provider versions",
      description: "Every published version of a Terraform provider, newest first, with its plugin protocol versions and platform count.",
      inputSchema: z.object( { namespace: z.string().describe("Namespace like hashicorp."), name: z.string().describe("Provider name like aws."), limit: z.number().int().min(1).max(100).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement versions locally (paywall removed)
    try { return textError("Not yet implemented: versions") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "module_versions",
    {
      title: "Module versions",
      description: "Every published version of a Terraform module, newest first, with required provider version, submodule count and deprecation note.",
      inputSchema: z.object( { namespace: z.string().describe("Namespace."), name: z.string().describe("Module name."), provider: z.string().describe("Provider like aws."), limit: z.number().int().min(1).max(100).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement versions locally (paywall removed)
    try { return textError("Not yet implemented: versions") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
