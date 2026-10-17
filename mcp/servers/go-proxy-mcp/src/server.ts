import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_latest, m0_versions } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'go-proxy-mcp', version: '1.0.0' })
server.registerTool(
    "latest",
    {
      title: "Latest",
      description: "Latest version of a Go module.",
      inputSchema: z.object( { module: z.string().describe("Module path like github.com/gin-gonic/gin.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_latest(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "versions",
    {
      title: "Versions",
      description: "Available versions of a Go module.",
      inputSchema: z.object( { module: z.string().describe("Module path."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_versions(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "The Go module proxy's record for one specific version: publication time, VCS, source repository, ref and commit hash.",
      inputSchema: z.object( { module: z.string().describe("Module path like github.com/gin-gonic/gin."), version: z.string().describe("Version like v1.9.1.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement info locally (paywall removed)
    try { return textError("Not yet implemented: info") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "module_manifest",
    {
      title: "Module manifest",
      description: "The go.mod a Go module version declares: its Go version requirement and every direct and indirect dependency it pins.",
      inputSchema: z.object( { module: z.string().describe("Module path like github.com/gin-gonic/gin."), version: z.string().describe("Version like v1.9.1.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement manifest locally (paywall removed)
    try { return textError("Not yet implemented: manifest") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
