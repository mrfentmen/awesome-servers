import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ModrinthError, formatHit, formatProject, formatVersion, getProject, getProjectVersions, searchProjects, filterIndex } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "modrinth-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_mods",
    {
      title: "Search mods",
      description: "Search Modrinth for Minecraft mods/modpacks/plugins, optionally " +
      "filtered by loader (fabric/forge/neoforge/quilt) and game version.",
      inputSchema: z.object(
    {
      query: z.string().describe("e.g. 'sodium', 'create', 'journeymap'"),
      loader: z.string().optional().describe("e.g. 'fabric', 'forge', 'neoforge'"),
      gameVersion: z.string().optional().describe("e.g. '1.20.1', '1.21'"),
      limit: z.number().int().min(1).max(20).default(10).describe("Max results"),
    }),
      annotations: READ_ONLY,
    },
    async ({ query, loader, gameVersion, limit }) => {
      try {
        const hits = await searchProjects(query, "mod", loader, gameVersion, limit)
        if (hits.length === 0) {
          return text(`No mods found for "${query}".`)
        }
        const head = `Mods matching "${query}"` +
          (loader ? ` (loader: ${loader})` : "") +
          (gameVersion ? ` (MC ${gameVersion})` : "") + ":\n"
        return text(head + hits.map((h, i) => formatHit(h, i + 1)).join("\n\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_mod",
    {
      title: "Get mod",
      description: "Get full details for a Modrinth project by slug: description, " +
      "loaders, supported game versions, stats.",
      inputSchema: z.object(
    { slug: z.string().describe("Mod slug, e.g. 'sodium' or 'create'") }),
      annotations: READ_ONLY,
    },
    async ({ slug }) => {
      try {
        const project = await getProject(slug)
        if (!project) return text(`No Modrinth project "${slug}".`)
        return text(formatProject(project))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_mod_versions",
    {
      title: "Get mod versions",
      description: "List versions of a mod, optionally filtered by loader and game " +
      "version, with download links and required dependencies.",
      inputSchema: z.object(
    {
      slug: z.string().describe("Mod slug, e.g. 'sodium'"),
      loader: z.string().optional().describe("e.g. 'fabric', 'forge'"),
      gameVersion: z.string().optional().describe("e.g. '1.20.1'"),
      limit: z.number().int().min(1).max(20).default(5).describe("Max versions"),
    }),
      annotations: READ_ONLY,
    },
    async ({ slug, loader, gameVersion, limit }) => {
      try {
        const versions = await getProjectVersions(slug, loader, gameVersion, limit)
        if (versions.length === 0) {
          return text(
            `No versions of "${slug}"${loader ? ` for ${loader}` : ""}${gameVersion ? ` on ${gameVersion}` : ""}.`
          )
        }
        return text(
          `Versions of "${slug}":\n` +
            versions.map((v, i) => formatVersion(v, i + 1)).join("\n\n")
        )
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "filter_index",
    {
      title: "Filter index",
      description: "The loader names, game versions and categories the Modrinth filters really accept, read from the tag index.",
      inputSchema: z.object( { projectType: z.string().describe("Limit categories to one project type, like mod or resourcepack.").optional(), releaseLimit: z.number().describe("How many recent release versions to list, 1-200. Defaults to 30.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await filterIndex(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "search_sorted",
    {
      title: "Sorted search",
      description: "Search Modrinth ordered by downloads, follows or date, with offset paging and the real match count.",
      inputSchema: z.object( { query: z.string().describe("Search text, like sodium or shaders."), order: z.string().describe("relevance, downloads, follows, newest or updated. Defaults to relevance.").optional(), projectType: z.string().describe("mod, modpack, resourcepack, shader, plugin or datapack.").optional(), limit: z.number().describe("Results per page, 1-100. Defaults to 20.").optional(), offset: z.number().describe("How many to skip, for paging. Defaults to 0.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement sorted locally (paywall removed)
    try { return textError("Not yet implemented: sorted") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "version_files",
    {
      title: "Version files",
      description: "One version's files with the sha1 and sha512 hashes to verify a download against, plus its dependencies.",
      inputSchema: z.object( { versionId: z.string().describe("Version id, like NM9w06Kr. get_mod_versions lists them.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement files locally (paywall removed)
    try { return textError("Not yet implemented: files") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ModrinthError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
