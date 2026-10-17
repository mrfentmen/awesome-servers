import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, repoHeader } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "f-droid-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search F-Droid apps.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "package_versions",
    {
      title: "Package versions",
      description: "Every build F-Droid carries for one package: how many there are, how many distinct version names, the suggested version code, the version code range and the newest twenty builds by code. The search tool cannot reach this because the F-Droid search route it calls does not exist, so this is currently the only working route into the F-Droid API on this server.",
      inputSchema: z.object( { package: z.string().describe("F-Droid package name, like org.fdroid.fdroid.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement versions locally (paywall removed)
    try { return textError("Not yet implemented: versions") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "repo_header",
    {
      title: "Repository header",
      description: "The F-Droid repository's own header: when the index was built, its format version, how long clients may cache it, the repository address and every mirror including the onion ones. It reads only the first 64 KB of the index with an HTTP Range request, so it does not download the 63 MB file.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await repoHeader()) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
