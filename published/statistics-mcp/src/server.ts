import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { correlate, describeSample, linearRegression, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "statistics-mcp", version: "1.0.0" })

  server.tool(
    "describe_sample",
    "Mean, median, quartiles, spread and outliers for a sample.",
    {
      values: z.array(z.number()).min(2).max(100000).describe("Numeric sample")
    },
    async (a) => {
      try {
        return text(await describeSample(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "correlate",
    "Pearson and Spearman correlation between two equal-length series.",
    {
      xs: z.array(z.number()).min(3).describe("First series"),
      ys: z.array(z.number()).min(3).describe("Second series, same length")
    },
    async (a) => {
      try {
        return text(await correlate(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "linear_regression",
    "Fit y = a + bx and report slope, intercept, R squared and standard error.",
    {
      xs: z.array(z.number()).min(3).describe("Predictor values"),
      ys: z.array(z.number()).min(3).describe("Response values, same length")
    },
    async (a) => {
      try {
        return text(await linearRegression(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
