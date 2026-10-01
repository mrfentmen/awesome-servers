import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { collection, collections, collectionReleaseHistory } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ansible-galaxy-mcp", version: "1.0.0" })
  server.registerTool(
    "collections",
    {
      title: "Collections",
      description: "Search Ansible collections.",
      inputSchema: z.object( { search: z.string().describe("Optional search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await collections(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "collection",
    {
      title: "Collection",
      description: "Details for one collection.",
      inputSchema: z.object( { namespace: z.string().describe("Namespace."), name: z.string().describe("Collection name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await collection(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "collection_release_history",
    {
      title: "Collection release history",
      description: "Every released version of one Ansible collection with its publish date and the ansible core version it requires, so you can see the maintenance branches and how old each one is. The collection tool only looks at the newest release.",
      inputSchema: z.object( { namespace: z.string().describe("Namespace, like community."), name: z.string().describe("Collection name, like general.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await collectionReleaseHistory(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "collection_contents",
    {
      title: "Collection contents",
      description: "What one released version of an Ansible collection actually contains: the sha256 and size of the tarball, the licence, the source commit, the collections it depends on and every plugin type it ships with a count and examples. The collection tool never returns any of this.",
      inputSchema: z.object( { namespace: z.string().describe("Namespace, like community."), name: z.string().describe("Collection name, like general."), version: z.string().describe("The exact version to inspect, like 13.4.0.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: collection_contents ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ansible_galaxy_collection_contents", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
