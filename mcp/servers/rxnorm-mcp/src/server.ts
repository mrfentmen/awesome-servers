import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  conceptLine,
  drugs,
  ndcs,
  normalize,
  properties,
  related,
  RxNavError,
  spellings,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof RxNavError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "rxnorm-mcp", version: "1.0.0" })

  server.tool(
    "drug_lookup",
    "Find RxNorm concepts for a drug name: ingredients, brands and dose forms.",
    {
      name: z.string().min(1).describe("Drug name, e.g. metformin"),
      limit: z.number().int().min(1).max(50).default(15).describe("Concepts"),
    },
    async ({ name, limit }) => {
      try {
        const rows = await drugs(name)
        if (!rows.length) return text(`No RxNorm concepts for "${name}".`)
        return text(rows.slice(0, limit).map(conceptLine).join("\n"))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "normalize_name",
    "Resolve a messy drug string to RxNorm concept ids.",
    { name: z.string().min(1).describe("Free-text drug name, e.g. glucophage 500mg") },
    async ({ name }) => {
      try {
        const ids = await normalize(name)
        return text(ids.length ? ids.join("\n") : `No RxNorm id for "${name}".`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "drug_properties",
    "Full RxNorm record for one concept id.",
    { rxcui: z.string().min(1).describe("RxNorm concept id") },
    async ({ rxcui }) => {
      try {
        const p = await properties(rxcui)
        if (!p) return text(`No concept ${rxcui}.`)
        return text(
          [
            `rxcui: ${p.rxcui}`,
            `name: ${p.name ?? "?"}`,
            `synonym: ${p.synonym ?? "-"}`,
            `term type: ${p.tty ?? "?"}`,
            `language: ${p.language ?? "?"}`,
          ].join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "package_ndcs",
    "National Drug Codes that package a concept.",
    {
      rxcui: z.string().min(1).describe("RxNorm concept id"),
      limit: z.number().int().min(1).max(100).default(30).describe("NDCs"),
    },
    async ({ rxcui, limit }) => {
      try {
        const rows = await ndcs(rxcui)
        return text(rows.length ? rows.slice(0, limit).join("\n") : `No NDCs for ${rxcui}.`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "related_concepts",
    "Everything RxNorm relates to a concept: brands, ingredients, packs and dose forms.",
    {
      rxcui: z.string().min(1).describe("RxNorm concept id"),
      limit: z.number().int().min(1).max(100).default(30).describe("Concepts"),
    },
    async ({ rxcui, limit }) => {
      try {
        const rows = await related(rxcui)
        if (!rows.length) return text(`No related concepts for ${rxcui}.`)
        return text(rows.slice(0, limit).map(conceptLine).join("\n"))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "spelling_suggestions",
    "Did-you-mean suggestions for a misspelled drug name.",
    { name: z.string().min(1).describe("Misspelled name, e.g. metformn") },
    async ({ name }) => {
      try {
        const rows = await spellings(name)
        return text(rows.length ? rows.join("\n") : `No suggestions for "${name}".`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
