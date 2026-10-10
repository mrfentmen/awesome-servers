import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { answer, siteUp, domainTaken, personAlive } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "yesno-mcp", version: "1.0.0" })
  server.registerTool(
    "answer",
    {
      title: "Answer",
      description: "A random yes or no answer.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await answer(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "is_site_up",
    {
      title: "Is site up",
      description: "Answer a real yes or no question: does this site respond right now? Reports the status code, how long it took and the final URL.",
      inputSchema: z.object({ url: z.string().describe("URL or hostname, for example example.com.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: is_site_up ----
    const paywallMessage = await premiumRequired("is_site_up")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await siteUp(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "is_domain_taken",
    {
      title: "Is domain taken",
      description: "Answer a real yes or no question: is this domain already registered? Uses the registry's RDAP record and reports registrar dates and status.",
      inputSchema: z.object({ domain: z.string().describe("Domain to check, for example example.com.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: is_domain_taken ----
    const paywallMessage = await premiumRequired("is_domain_taken")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await domainTaken(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "is_person_alive",
    {
      title: "Is person alive",
      description: "Answer a real yes or no question from Wikidata: is this person still alive? Reports the birth and death dates on record.",
      inputSchema: z.object({ name: z.string().describe("Person name, for example 'Ada Lovelace'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: is_person_alive ----
    const paywallMessage = await premiumRequired("is_person_alive")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await personAlive(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
