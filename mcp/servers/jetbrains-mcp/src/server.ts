import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatHit, formatPlugin, formatRating, formatReview, getPlugin, JetBrainsError, pluginRatings, pluginReviews, pluginVersions, searchPlugins, topPlugins, searchByBuild, listTags, errorMessage } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const ORDER = z
  .enum(["relevance", "downloads", "rating", "name", "updated"])
  .describe("Sort order (default relevance).")
  .optional()

export function createServer(): McpServer {
  const server = new McpServer({
    name: "jetbrains-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_plugins",
    {
      title: "Search plugins",
      description:
        "Search JetBrains Marketplace plugins: names, descriptions, downloads, ratings. " +
        "Sort by relevance, downloads, rating, name or recently updated.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'python', 'vim', 'git'"),
        orderBy: ORDER,
        limit: z.number().int().min(1).max(20).default(5).describe("How many plugins to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, orderBy, limit }) => {
      try {
        const results = await searchPlugins(query, limit, orderBy)
        if (results.length === 0) return text(`No plugins match "${query}".`)
        return text(`JetBrains plugins for "${query}":\n\n${results.map((p, i) => formatHit(p, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_plugin",
    {
      title: "Get plugin details",
      description: "One JetBrains plugin: vendor, downloads, rating, description, page link.",
      inputSchema: z.object({
        id: z.string().describe("Numeric plugin id, e.g. '9525' (use search_plugins to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatPlugin(await getPlugin(id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "top_plugins",
    {
      title: "Top plugins",
      description: "The Marketplace charts: the most-downloaded or highest-rated plugins overall.",
      inputSchema: z.object({
        orderBy: z.enum(["downloads", "rating"]).describe("Chart to use (default downloads).").optional(),
        limit: z.number().int().min(1).max(20).default(10).describe("How many plugins to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ orderBy, limit }) => {
      try {
        const by = orderBy ?? "downloads"
        const results = await topPlugins(by, limit)
        if (results.length === 0) return text("No plugins returned.")
        return text(
          `Most ${by === "downloads" ? "downloaded" : "highly rated"} JetBrains plugins:\n\n` +
            results.map((p, i) => formatHit(p, i)).join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "plugin_versions",
    {
      title: "Plugin versions",
      description: "Recent releases of one plugin, with version strings and release dates.",
      inputSchema: z.object({
        id: z.string().describe("Numeric plugin id, e.g. '7499'."),
        limit: z.number().int().min(1).max(20).default(5).describe("How many releases to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        const versions = await pluginVersions(id, limit)
        if (versions.length === 0) return text(`No releases published for plugin ${id}.`)
        return text(
          `Recent releases of plugin ${id}:\n` +
            versions
              .map((v, i) => `${i + 1}. ${v.version}${v.date ? ` — ${v.date}` : ""}${v.link ? `\n   ${v.link}` : ""}`)
              .join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "plugin_reviews",
    {
      title: "Plugin reviews",
      description:
        "Read the most recent written reviews of a plugin, with each reviewer's star rating and date, so you can judge real user sentiment.",
      inputSchema: z.object({
        id: z.string().describe('Numeric plugin id, e.g. "1347". Use search_plugins to find it.'),
        limit: z.number().int().min(1).max(20).describe("How many reviews to show, 1-20 (default 5).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        const reviews = await pluginReviews(id, limit ?? 5)
        if (!reviews.length) return text(`Plugin ${id} has no written reviews.`)
        return text(
          `Recent reviews of plugin ${id} (${reviews.length}):\n\n` +
            reviews.map((review, i) => formatReview(review, i)).join("\n\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "plugin_ratings",
    {
      title: "Plugin rating breakdown",
      description:
        "Show a plugin's review score distribution — how many raters gave each star value and the average — so an agent can tell a strong plugin from a thin one.",
      inputSchema: z.object({
        id: z.string().describe('Numeric plugin id, e.g. "1347". Use search_plugins to find it.'),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const rating = await pluginRatings(id)
        if (!rating.total) return text(`Plugin ${id} has no ratings yet.`)
        return text(`Rating breakdown for plugin ${id}:\n${formatRating(rating)}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_by_build",
    {
      title: "Search by IDE build",
      description: "Find plugins that actually install on a specific IDE build, e.g. IC-241.18034.62.",
      inputSchema: z.object({
        query: z.string().describe("Search text; empty string lists the top plugins for that build."),
        build: z.string().describe("IDE build id like IC-241.18034.62, IU-241.18034.62 or PY-241.18034.62."),
        limit: z.number().describe("Max results (default 5, max 20).").optional(),
        order_by: z.enum(["relevance", "downloads", "rating", "name", "updated"]).describe("Sort order (default downloads).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, build, limit, order_by: orderBy }) => {
      try { return text(await searchByBuild(query, build, limit, orderBy)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description: "Every Marketplace tag with its id and product families, filterable by family.",
      inputSchema: z.object({
        limit: z.number().describe("Tags to show (default 80, max 300).").optional(),
        family: z.string().describe("Filter by family, e.g. intellij, pycharm, youtrack.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit, family }) => {
      try { return text(await listTags(limit, family)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "product_release",
    {
      title: "Product release",
      description: "The current release of a JetBrains product: version, build number to paste into search_by_build, release date, patches, licence flag and the download size per platform. No key needed.",
      inputSchema: z.object({ product: z.string().describe("Product code, e.g. IU, PY, WS or IC") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: product_release ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_jetbrains_product_release", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "plugin_compatibility",
    {
      title: "Plugin compatibility",
      description: "Which IDE builds each recent release of a plugin declares compatibility with, with publish date, download count, channel, approval state and artifact size. The version list never shows the since/until build range.",
      inputSchema: z.object({ id: z.string().describe("Numeric plugin id, e.g. 9525"), limit: z.number().int().min(1).max(20).default(6).describe("How many releases to report (default 6, max 20).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: plugin_compatibility ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_jetbrains_plugin_compatibility", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}

