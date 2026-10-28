import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  comparePackages,
  PackagistError,
  packageDependencies,
  packageInfo,
  packageVersions,
  popularPackages,
  registryTotals,
  searchPackages,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof PackagistError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const nameArg = z.string().min(3).describe("vendor/package, e.g. monolog/monolog")

export function createServer(): McpServer {
  const server = new McpServer({ name: "packagist-mcp", version: "1.0.0" })

  server.tool(
    "search_packages",
    "Search Packagist (PHP) packages by keyword, ranked with download counts.",
    {
      query: z.string().min(1).describe("Search term, e.g. logger"),
      limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    },
    async ({ query, limit }) => {
      try {
        return text(await searchPackages(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "package_info",
    "Downloads, favers, latest version and requirements for one package.",
    { name: nameArg },
    async ({ name }) => {
      try {
        return text(await packageInfo(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "popular_packages",
    "Packagist's most popular packages right now.",
    { limit: z.number().int().min(1).max(50).default(15).describe("Packages to return") },
    async ({ limit }) => {
      try {
        return text(await popularPackages(limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "package_versions",
    "Recent release history for a package, newest first.",
    {
      name: nameArg,
      limit: z.number().int().min(1).max(50).default(10).describe("Versions to return"),
    },
    async ({ name, limit }) => {
      try {
        return text(await packageVersions(name, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "package_dependencies",
    "Runtime and dev requirements of a package's newest release.",
    { name: nameArg },
    async ({ name }) => {
      try {
        return text(await packageDependencies(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "compare_packages",
    "Compare downloads, favers and latest version of two packages.",
    {
      first: nameArg,
      second: nameArg,
    },
    async ({ first, second }) => {
      try {
        return text(await comparePackages(first, second))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "registry_totals",
    "Total packages, versions and downloads tracked by Packagist.",
    {},
    async () => {
      try {
        return text(await registryTotals())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
