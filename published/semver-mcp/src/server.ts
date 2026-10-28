import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { compareVersions, parseVersion, satisfiesRange, sortVersions, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "semver-mcp", version: "1.0.1" })

  server.tool(
    "parse_version",
    "Break a version into major, minor, patch, prerelease and build parts.",
    {
      version: z.string().min(1).describe("Version string, e.g. 1.2.3-beta.1+build.5")
    },
    async (a) => {
      try {
        return text(await parseVersion(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "compare_versions",
    "Compare two versions by semver precedence.",
    {
      a: z.string().min(1).describe("First version"),
      b: z.string().min(1).describe("Second version")
    },
    async (a) => {
      try {
        return text(await compareVersions(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "sort_versions",
    "Sort a list of versions from lowest to highest.",
    {
      versions: z.array(z.string().min(1)).min(1).max(100).describe("Versions to sort"),
      descending: z.boolean().default(false).describe("Highest first")
    },
    async (a) => {
      try {
        return text(await sortVersions(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "satisfies_range",
    "Check a version against a range: ^ ~ x-ranges, comparisons, hyphen ranges and ||.",
    {
      version: z.string().min(1).describe("Version to test, e.g. 1.4.2"),
      range: z.string().min(1).describe("Range, e.g. ^1.2.0, ~1.4, >=1.2.3 <2.0.0 or 1.2.3 - 1.9.0")
    },
    async (a) => {
      try {
        return text(await satisfiesRange(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
