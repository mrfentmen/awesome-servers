import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { ResourceType } from "./types.js"
import { RESOURCES } from "./types.js"
import {
  crossReference,
  downloadAsset,
  getAssetDetail,
  getConsoles,
  getDownloadUrl,
  getGameAssets,
  getGames,
  getLatestAssets,
  getPopularAssets,
  getRandomAsset,
  searchAssets,
} from "./scraper.js"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

const resourceEnum = z.enum(["sprites", "models", "textures", "sounds"])

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

async function safe<T>(promise: Promise<T>, onError: string): Promise<Result<T>> {
  try {
    const value = await promise
    return { ok: true, value }
  } catch {
    return { ok: false, error: onError }
  }
}

async function handleSearch(query: string, resource?: ResourceType) {
  const res: ResourceType = resource ?? "sprites"
  const assets = await searchAssets(res, query)
  if (assets.length === 0) {
    return `No assets found for "${query}"`
  }
  const lines = assets.slice(0, 20).map((a) => `- **${a.name}** \u2014 ${a.game} (${a.console}) \u2014 ${a.assetUrl}`)
  return `# ${RESOURCES[res].name} Results\n\n${lines.join("\n")}`
}

async function handleBrowseConsole(consoleSlug: string, resource: ResourceType) {
  const result = await safe(getGames(resource, consoleSlug), "Failed to load games")
  if (!result.ok) return result.error
  if (result.value.length === 0) return `No games found for console "${consoleSlug}"`
  const lines = result.value.map((g) => `- **${g.name}** (${g.slug})`)
  return `# ${RESOURCES[resource].name} \u2014 ${consoleSlug}\n\n${lines.join("\n")}`
}

async function handleBrowseGame(consoleSlug: string, gameSlug: string, resource: ResourceType) {
  const result = await safe(getGameAssets(resource, consoleSlug, gameSlug), "Failed to load assets")
  if (!result.ok) return result.error
  if (result.value.length === 0) return `No assets found for ${gameSlug}`
  const lines = result.value.map((a) => `- **${a.name}** \u2014 ${a.assetUrl}`)
  return `# ${gameSlug} (${consoleSlug})\n\n${lines.join("\n")}`
}

async function handleAssetDetail(url: string) {
  const result = await safe(getAssetDetail(url), "Failed to load asset details")
  if (!result.ok) return result.error
  const detail = result.value
  const lines = [`**Name:** ${detail.name || "Unknown"}`, `**URL:** ${url}`]
  if (detail.downloadUrl) lines.push(`**Download:** ${detail.downloadUrl}`)
  if (detail.uploadDate) lines.push(`**Uploaded:** ${detail.uploadDate}`)
  return lines.join("\n")
}

async function handleLatest(resource: ResourceType, limit: number) {
  const result = await safe(getLatestAssets(resource, limit), "Failed to load latest assets")
  if (!result.ok) return result.error
  const lines = result.value.map((a) => `- **${a.name}** \u2014 ${a.game} (${a.console}) \u2014 ${a.assetUrl}`)
  return `# Latest ${RESOURCES[resource].name} Assets\n\n${lines.join("\n")}`
}

async function handlePopular(resource: ResourceType, limit: number) {
  const result = await safe(getPopularAssets(resource, limit), "Failed to load popular assets")
  if (!result.ok) return result.error
  const lines = result.value.map((a) => `- **${a.name}** \u2014 ${a.game} (${a.console}) \u2014 ${a.assetUrl}`)
  return `# Popular ${RESOURCES[resource].name} Assets\n\n${lines.join("\n")}`
}

async function handleRandom(resource: ResourceType) {
  const result = await safe(getRandomAsset(resource), "Failed to get random asset")
  if (!result.ok) return result.error
  const asset = result.value
  if (!asset) return "Could not get random asset"
  return `**Random ${RESOURCES[resource].name} Asset:**\n- **${asset.name}** \u2014 ${asset.game} (${asset.console})\n- ${asset.assetUrl}`
}

async function handleCrossReference(gameName: string) {
  const result = await safe(crossReference(gameName), "Failed to cross-reference")
  if (!result.ok) return result.error
  if (result.value.length === 0) return `No results for "${gameName}" across any resource.`
  const lines = [`# Cross-Reference: ${gameName}\n`]
  for (const { resource, assets } of result.value) {
    lines.push(`## ${RESOURCES[resource].name} (${assets.length} results)\n`)
    for (const a of assets.slice(0, 5)) {
      lines.push(`- **${a.name}** \u2014 ${a.assetUrl}`)
    }
    lines.push("")
  }
  return lines.join("\n")
}

async function handleConsoles(resource: ResourceType) {
  const result = await safe(getConsoles(resource), "Failed to load consoles")
  if (!result.ok) return result.error
  if (result.value.length === 0) return "Could not retrieve console list"
  const lines = result.value.map((c) => `- **${c.name}** (${c.slug})`)
  return `# ${RESOURCES[resource].name} Consoles\n\n${lines.join("\n")}`
}

async function handleDownload(assetPageUrl: string, destPath: string) {
  const pageResult = await safe(getDownloadUrl(assetPageUrl), "Failed to find download URL")
  if (!pageResult.ok) return pageResult.error
  const downloadUrl = pageResult.value
  if (!downloadUrl) return `Could not find download URL for ${assetPageUrl}. Try get_asset_detail first.`
  const dlResult = await safe(downloadAsset(downloadUrl, destPath), "Failed to download file")
  if (!dlResult.ok) return dlResult.error
  return `Downloaded ${dlResult.value.size} bytes to ${dlResult.value.path}`
}

async function handleBatchDownload(assetPageUrls: string[], destDir: string) {
  const results: string[] = []
  for (const url of assetPageUrls) {
    const pageResult = await safe(getDownloadUrl(url), "Failed to find download URL")
    if (!pageResult.ok) {
      results.push(`SKIP: ${url} (no download URL)`)
      continue
    }
    const downloadUrl = pageResult.value
    if (!downloadUrl) {
      results.push(`SKIP: ${url} (no download URL)`)
      continue
    }
    const filename = url.split("/").filter(Boolean).slice(-3, -1).join("_") + "_" + Date.now()
    const ext = downloadUrl.match(/\.[a-z0-9]+$/i)?.[0] || ""
    const destPath = `${destDir}/${filename}${ext}`
    const dlResult = await safe(downloadAsset(downloadUrl, destPath), "Download failed")
    if (!dlResult.ok) {
      results.push(`FAIL: ${url} (${dlResult.error})`)
      continue
    }
    results.push(`OK: ${dlResult.value.path} (${dlResult.value.size} bytes)`)
  }
  return `# Batch Download Results\n\n${results.join("\n")}`
}

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] }
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "vg-resource", version: "1.0.0" })

  server.registerTool(
    "search_assets",
    {
      title: "Search assets",
      description: "Search for assets across The VG Resource network. Returns matching sprites, models, textures, or sounds.",
      inputSchema: z.object(
    { query: z.string().describe("Search term"), resource: resourceEnum.optional().describe("Resource type") }),
      annotations: READ_ONLY,
    },
    // @ts-ignore - SDK overload resolution depth
    async (args: any) => {
      const text = await handleSearch(args.query, args.resource)
      return textResult(text)
    }
  )

  server.registerTool(
    "browse_console",
    {
      title: "Browse console",
      description: "List all games for a specific console/platform on a resource.",
      inputSchema: z.object(
    {
      console: z.string().describe("Console slug (e.g., 'playstation', 'snes')"),
      resource: resourceEnum.optional().describe("Resource type. Defaults to sprites."),
    }),
      annotations: READ_ONLY,
    },
    async (args: { console: string; resource?: ResourceType }) => {
      const text = await handleBrowseConsole(args.console, args.resource ?? "sprites")
      return textResult(text)
    }
  )

  server.registerTool(
    "browse_game",
    {
      title: "Browse game",
      description: "List all assets for a specific game.",
      inputSchema: z.object(
    {
      console: z.string().describe("Console slug"),
      game: z.string().describe("Game slug"),
      resource: resourceEnum.optional().describe("Resource type. Defaults to sprites."),
    }),
      annotations: READ_ONLY,
    },
    async (args: { console: string; game: string; resource?: ResourceType }) => {
      const text = await handleBrowseGame(args.console, args.game, args.resource ?? "sprites")
      return textResult(text)
    }
  )

  server.registerTool(
    "get_asset_detail",
    {
      title: "Get asset detail",
      description: "Get detailed information about a specific asset including download URL.",
      inputSchema: z.object(
    { url: z.string().describe("Full asset URL") }),
      annotations: READ_ONLY,
    },
    async (args: { url: string }) => {
      const text = await handleAssetDetail(args.url)
      return textResult(text)
    }
  )

  server.registerTool(
    "get_latest",
    {
      title: "Get latest",
      description: "Get the latest/recently uploaded assets across a resource.",
      inputSchema: z.object(
    {
      resource: resourceEnum.optional().describe("Resource type. Defaults to sprites."),
      limit: z.number().min(1).max(50).optional().describe("Number of results. Default 20."),
    }),
      annotations: READ_ONLY,
    },
    async (args: { resource?: ResourceType; limit?: number }) => {
      const text = await handleLatest(args.resource ?? "sprites", args.limit ?? 20)
      return textResult(text)
    }
  )

  server.registerTool(
    "get_popular",
    {
      title: "Get popular",
      description: "Get the most popular/hit assets across a resource.",
      inputSchema: z.object(
    {
      resource: resourceEnum.optional().describe("Resource type. Defaults to sprites."),
      limit: z.number().min(1).max(50).optional().describe("Number of results. Default 20."),
    }),
      annotations: READ_ONLY,
    },
    async (args: { resource?: ResourceType; limit?: number }) => {
      const text = await handlePopular(args.resource ?? "sprites", args.limit ?? 20)
      return textResult(text)
    }
  )

  server.registerTool(
    "random_asset",
    {
      title: "Random asset",
      description: "Get a random asset from a resource. Rolls the dice on 100k+ assets.",
      inputSchema: z.object(
    { resource: resourceEnum.optional().describe("Resource type. Defaults to sprites.") }),
      annotations: READ_ONLY,
    },
    async (args: { resource?: ResourceType }) => {
      const text = await handleRandom(args.resource ?? "sprites")
      return textResult(text)
    }
  )

  server.registerTool(
    "cross_reference",
    {
      title: "Cross reference",
      description: "Find the same game across all 4 resources (sprites, models, textures, sounds).",
      inputSchema: z.object(
    { game_name: z.string().describe("Game name to search for") }),
      annotations: READ_ONLY,
    },
    async (args: { game_name: string }) => {
      const text = await handleCrossReference(args.game_name)
      return textResult(text)
    }
  )

  server.registerTool(
    "list_consoles",
    {
      title: "List consoles",
      description: "List all available consoles/platforms for a resource.",
      inputSchema: z.object(
    { resource: resourceEnum.optional().describe("Resource type. Defaults to sprites.") }),
      annotations: READ_ONLY,
    },
    async (args: { resource?: ResourceType }) => {
      const text = await handleConsoles(args.resource ?? "sprites")
      return textResult(text)
    }
  )

  server.registerTool(
    "download_asset",
    {
      title: "Download asset",
      description: "Download an asset from its page URL to a local file. Extracts the download link and saves the file.",
      inputSchema: z.object(
    {
      asset_page_url: z.string().describe("The full URL of the asset page (from search/browse results)"),
      dest_path: z.string().describe("Local file path to save to (e.g., './downloads/mario.png')"),
    }),
      annotations: WRITE,
    },
    async (args: { asset_page_url: string; dest_path: string }) => {
      const text = await handleDownload(args.asset_page_url, args.dest_path)
      return textResult(text)
    }
  )

  server.registerTool(
    "batch_download",
    {
      title: "Batch download",
      description: "Download multiple assets from their page URLs to a directory. Useful for grabbing all assets from a game.",
      inputSchema: z.object(
    {
      asset_page_urls: z.array(z.string()).describe("List of asset page URLs to download"),
      dest_dir: z.string().describe("Directory to save files into (created if needed)"),
    }),
      annotations: WRITE,
    },
    // @ts-ignore - SDK overload resolution depth
    async (args: any) => {
      const text = await handleBatchDownload(args.asset_page_urls, args.dest_dir)
      return textResult(text)
    }
  )

  return server
}
