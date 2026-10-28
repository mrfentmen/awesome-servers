import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { createVcard, parseVcard, vcardToJson, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "vcard-mcp", version: "1.0.0" })

  server.tool(
    "parse_vcard",
    "Parse .vcf text and show each contact's name, organisation, phones, emails, address and note.",
    {
      text: z.string().describe('Raw vCard text'), limit: z.number().int().min(1).max(20).optional().describe('Cards to show, default 5')
    },
    async (a) => {
      try {
        return text(await parseVcard(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "vcard_to_json",
    "Convert .vcf text into structured JSON: names split into parts, typed phones and emails.",
    {
      text: z.string().describe('Raw vCard text'), limit: z.number().int().min(1).max(20).optional().describe('Cards to convert, default 5')
    },
    async (a) => {
      try {
        return text(await vcardToJson(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "create_vcard",
    "Build vCard 4.0 text for one contact with escaped values and tel: URIs.",
    {
      fullName: z.string().describe('Full name shown to people'), firstName: z.string().optional().describe('Given name, inferred from fullName when omitted'), lastName: z.string().optional().describe('Family name, inferred from fullName when omitted'), org: z.string().optional().describe('Organisation'), title: z.string().optional().describe('Job title'), phones: z.string().optional().describe('Comma-separated phone numbers'), emails: z.string().optional().describe('Comma-separated email addresses'), url: z.string().optional().describe('Website'), note: z.string().optional().describe('Free-form note')
    },
    async (a) => {
      try {
        return text(await createVcard(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
