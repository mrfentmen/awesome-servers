import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { newsByCountry, searchNews, source_country_breakdown } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "gdelt-mcp", version: "1.0.0" })
  server.registerTool(
    "search_news",
    {
      title: "Search news",
      description: "Search news articles by keyword.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional(), language: z.string().describe("Two letter language code.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchNews(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "news_by_country",
    {
      title: "News by country",
      description: "Search news mentioning a country or region.",
      inputSchema: z.object( { country: z.string().describe("Country or place name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await newsByCountry(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "source_country_breakdown",
    {
      title: "Source country breakdown",
      description: "Take the articles array from a GDELT mode=artlist response and report which countries published them, with counts and shares, alongside the language mix, the number of distinct outlets, the date window, and whether the coverage is one country's press or many. search_news and news_by_country both throw sourcecountry away, so a tool called news by country never actually shows you a country.",
      inputSchema: z.object({
        articles: z.array(z.object({}).passthrough()).describe("The articles array from a GDELT doc API mode=artlist response. sourcecountry, language, domain, seendate and title are read."),
        label: z.string().optional().describe("What the search was for, used only in the heading."),
      }),
      annotations: READ_ONLY,
    },
    async ({ articles, label }) => {
      try { return text(await source_country_breakdown({ articles, label })) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "domain_ranking",
    {
      title: "Domain ranking",
      description: "Rank the domains in a GDELT articles array by how much they published on a term, with each one's count, share, country, language and leading headline, then judge whether the coverage is one outlet's beat or broadly held, and how many domains appear only once. search_news returns the same articles as an undifferentiated list, so nothing about who is publishing can be read from it.",
      inputSchema: z.object({
        articles: z.array(z.object({}).passthrough()).describe("The articles array from a GDELT doc API mode=artlist response."),
        label: z.string().optional().describe("What the search was for, used only in the heading."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: domain_ranking ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_gdelt_domain_ranking", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "coverage_stats",
    {
      title: "Coverage stats",
      description: "Judge how much coverage a term really has, from a GDELT articles array: how many distinct domains, countries and languages are involved, which day carries the story with an articles-per-day histogram, the words repeated across the titles, and a verdict on whether it is concentrated in one outlet or one country. search_news returns a flat list with none of that on it.",
      inputSchema: z.object({
        articles: z.array(z.object({}).passthrough()).describe("The articles array from a GDELT doc API mode=artlist response."),
        label: z.string().optional().describe("What the search was for, used only in the heading."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: coverage_stats ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_gdelt_coverage_stats", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "syndication_clusters",
    {
      title: "Syndication clusters",
      description: "Group a GDELT articles array by near-duplicate headline to show how much of the coverage is one story reprinted across outlets, with the domains carrying each story. GDELT cannot be reached from this server, so the caller supplies the articles array.",
      inputSchema: z.object({
        articles: z.array(z.object({}).passthrough()).describe("The articles array from a GDELT doc API mode=artlist response."),
        label: z.string().optional().describe("What the search was for, used only in the heading."),
        limit: z.number().optional().describe("Max repeated clusters to list, 1-20."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: syndication_clusters ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_gdelt_syndication_clusters", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
