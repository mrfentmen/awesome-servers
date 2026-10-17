import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatLibrary, formatUser, JellyfinError, listLibraries, listUsers, serverInfo, audit_users, access_audit, library_summary } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "jellyfin-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "server_info",
    {
      title: "Server info",
      description: "Public info of the Jellyfin server: name, version. No key needed. Set JELLYFIN_URL for non-default hosts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const info = await serverInfo()
        return text(`${info.name ?? "Jellyfin"}${info.version ? ` ${info.version}` : ""}${info.id ? `\nId: ${info.id}` : ""}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Users on the server with admin flags and last activity. Needs JELLYFIN_API_KEY.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listUsers()
        if (rows.length === 0) return text("No users.")
        return text(rows.map((u, i) => formatUser(u, i)).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_libraries",
    {
      title: "List libraries",
      description: "Media libraries (movies, shows, music) with collection types. Needs JELLYFIN_API_KEY.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listLibraries()
        if (rows.length === 0) return text("No libraries.")
        return text(rows.map((l, i) => formatLibrary(l, i)).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "audit_users",
    {
      title: "Audit users",
      description: "Account hygiene across a Jellyfin server, read from the raw /Users payload: which accounts have never signed in, which are dormant at 90 days and at a year, which administrators have not been used in a year or never at all, which enabled accounts carry a local password, which authenticate through an external provider, which are both administrator and hidden from the user list, and which names are duplicated. list_users prints a name, an admin flag and a date and stops there.",
      inputSchema: z.object({
        users: z.array(z.object({}).passthrough()).describe("The array Jellyfin's /Users endpoint returns. Policy, LastLoginDate, LastActivityDate, hasPassword and Name are read."),
        now: z.string().optional().describe("Judge staleness against this ISO date instead of today, so the report is reproducible. Default is now."),
      }),
      annotations: READ_ONLY,
    },
    async ({ users, now }) => {
      try { return text(audit_users({ users, now })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "access_audit",
    {
      title: "Audit library access",
      description: "Work out who can see which library, from the EnabledFolders and EnableAllFolders policy on each user and the library list. Prints, library by library, exactly who can see it and who is excluded, then names any library that appears in nobody's folder list and so is reachable only by an administrator, plus any library id in a user's list that no longer exists. list_libraries prints names and types and cannot answer any of this.",
      inputSchema: z.object({
        users: z.array(z.object({}).passthrough()).describe("The array from /Users. Policy.IsAdministrator, Policy.IsDisabled, Policy.EnableAllFolders and Policy.EnabledFolders are read."),
        libraries: z.array(z.object({}).passthrough()).describe("The array from the Items of /Library/MediaFolders. Id and Name are read."),
      }),
      annotations: READ_ONLY,
    },
    async ({ users, libraries }) => {
      try { return text(access_audit({ users, libraries })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "library_summary",
    {
      title: "Summarise libraries",
      description: "Read the library configuration and say whether it is sound: how the libraries break down by collection type, which ones have no type and are therefore plain folders, which names or underlying item ids are duplicated, which libraries are still scanning, which report no filesystem location, and where the size sits if you pass item counts. list_libraries prints one line per library and flags nothing.",
      inputSchema: z.object({
        libraries: z.array(z.object({}).passthrough()).describe("The array from the Items of /Library/MediaFolders. Name, CollectionType, ItemId, Locations, RefreshStatus and LocationType are read."),
        itemCounts: z.record(z.number()).optional().describe("Optional item counts keyed by library name or by library id, to get the size share."),
      }),
      annotations: READ_ONLY,
    },
    async ({ libraries, itemCounts }) => {
      try { return text(library_summary({ libraries, itemCounts })) } catch (e) { return textError(String(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof JellyfinError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
