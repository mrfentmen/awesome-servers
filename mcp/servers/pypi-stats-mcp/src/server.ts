import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  byDate,
  byPythonMajor,
  bySystem,
  number,
  PyPIStatsError,
  recent,
  sliceLines,
  totals,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof PyPIStatsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "pypi-stats-mcp", version: "1.0.0" })

  server.tool(
    "recent_downloads",
    "Download totals for a PyPI package over the last day, week and month.",
    { package: z.string().min(1).describe("PyPI package name, e.g. requests") },
    async ({ package: pkg }) => {
      try {
        return text(`${pkg}\n${totals(await recent(pkg))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "downloads_over_time",
    "Daily download counts for a PyPI package, newest first. Mirrors excluded.",
    {
      package: z.string().min(1).describe("PyPI package name"),
      days: z.number().int().min(1).max(180).default(30).describe("How many days to return"),
    },
    async ({ package: pkg, days }) => {
      try {
        const rows = await byDate(pkg, days)
        if (!rows.length) return text(`No daily data for ${pkg}.`)
        const withTotal = rows.map((r) => `${r.date}: ${number(r.downloads)}`)
        const sum = rows.reduce((a, r) => a + (r.downloads ?? 0), 0)
        return text(`${pkg} — ${rows.length} days\n${withTotal.join("\n")}\n\nsum: ${number(sum)}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "python_versions",
    "Download split by Python major version for a PyPI package.",
    { package: z.string().min(1).describe("PyPI package name") },
    async ({ package: pkg }) => {
      try {
        return text(`${pkg} by Python version\n${sliceLines(await byPythonMajor(pkg), "version")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "system_breakdown",
    "Download split by operating system for a PyPI package.",
    {
      package: z.string().min(1).describe("PyPI package name"),
      limit: z.number().int().min(1).max(30).default(10).describe("Rows to return"),
    },
    async ({ package: pkg, limit }) => {
      try {
        return text(`${pkg} by system\n${sliceLines(await bySystem(pkg), "system", limit)}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "compare_packages",
    "Compare last-week downloads for up to ten PyPI packages.",
    {
      packages: z.array(z.string().min(1)).min(2).max(10).describe("Package names to compare"),
    },
    async ({ packages }) => {
      const rows: string[] = []
      for (const pkg of packages) {
        try {
          const r = await recent(pkg)
          rows.push(`${pkg}: week ${number(r.last_week)} | month ${number(r.last_month)}`)
        } catch (e) {
          rows.push(`${pkg}: ${errorMessage(e)}`)
        }
      }
      return text(rows.join("\n"))
    }
  )

  server.tool(
    "package_summary",
    "One-page summary for a PyPI package: recent totals, Python split, top systems.",
    { package: z.string().min(1).describe("PyPI package name") },
    async ({ package: pkg }) => {
      try {
        const [r, py, sys] = await Promise.all([recent(pkg), byPythonMajor(pkg), bySystem(pkg)])
        return text(
          [
            `${pkg}`,
            totals(r),
            "",
            "Python versions",
            sliceLines(py, "version", 6),
            "",
            "Systems",
            sliceLines(sys, "system", 6),
          ].join("\n")
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
