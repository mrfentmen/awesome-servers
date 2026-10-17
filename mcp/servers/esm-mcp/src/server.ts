import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { browse, resolve, versionRange } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "esm-mcp", version: "1.0.0" })
  server.registerTool(
    "resolve",
    {
      title: "Resolve",
      description: "Resolve a package version and module URL on esm.sh.",
      inputSchema: z.object( { name: z.string().describe("Package name."), version: z.string().describe("Optional version.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await resolve(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "browse",
    {
      title: "Browse",
      description: "Browse a module file in a package.",
      inputSchema: z.object( { name: z.string().describe("Package name."), version: z.string().describe("Optional version.").optional(), path: z.string().describe("File path inside the package.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await browse(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "package_metadata",
    {
      title: "Package metadata",
      description: "Read the real package manifest served by esm.sh: name, version, description, licence, main entry, homepage, repository, author, keywords and declared runtime and peer dependencies.",
      inputSchema: z.object( { name: z.string().describe("Package name."), version: z.string().describe("Version, defaults to latest.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement metadata locally (paywall removed)
    try { return textError("Not yet implemented: metadata") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "module_size_report",
    {
      title: "Module size report",
      description: "Compare how esm.sh builds a package for different targets such as es2022, esnext, node18 and deno, following each re-export stub to the real module and reporting the actual payload size rather than the stub.",
      inputSchema: z.object( { name: z.string().describe("Package name."), version: z.string().describe("Version, defaults to latest.").optional(), targets: z.string().describe("Comma separated build targets.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement report locally (paywall removed)
    try { return textError("Not yet implemented: report") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "version_range",
    {
      title: "Version range",
      description: "Resolve a semver range through esm.sh to the concrete published version it currently serves, and optionally compare two ranges to see whether a floating dependency can change the code you ship.",
      inputSchema: z.object( { name: z.string().describe("Package name."), range: z.string().describe("Semver range, e.g. ^4.17.0."), compare: z.string().describe("A second range to compare against.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await versionRange(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
