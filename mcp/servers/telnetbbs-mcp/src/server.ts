import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { BbsError, formatBbs, listAll } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "telnetbbs-mcp",
    version: "1.0.0",
  })

  server.tool(
    "list_bbses",
    "List live retro BBSes you can dial into right now. Optionally filter " +
      "by name or software (Synchronet, Mystic, WWIV).",
    {
      query: z.string().optional().describe("Filter by name or software keyword"),
      limit: z.number().int().min(1).max(50).default(15),
    },
    async ({ query, limit }) => {
      try {
        let all = await listAll()
        if (query) {
          const q = query.toLowerCase()
          all = all.filter(
            (b) =>
              b.name.toLowerCase().includes(q) ||
              (b.software ?? "").toLowerCase().includes(q)
          )
        }
        if (all.length === 0) return text(`No BBSes match "${query ?? ""}".`)
        const shown = all.slice(0, limit)
        return text(
          `${shown.length} of ${all.length} BBSes:\n\n` +
            shown.map((b, i) => formatBbs(b, i)).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_bbs",
    "Get the full listing for a specific BBS by name.",
    { name: z.string().describe("BBS name, e.g. '0xDECAFBAD BBS'") },
    async ({ name }) => {
      try {
        const all = await listAll()
        const found = all.find(
          (b) => b.name.toLowerCase() === name.toLowerCase()
        )
        if (!found) return text(`No BBS named "${name}". Try list_bbses first.`)
        return text(formatBbs(found))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "random_bbs",
    "Pick a random live BBS to explore, for the true dial up experience.",
    {},
    async () => {
      try {
        const all = await listAll()
        if (all.length === 0) return text("No BBSes found.")
        const pick = all[Math.floor(Math.random() * all.length)]
        return text(`Dialing ${pick.name}...\n\n${formatBbs(pick)}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BbsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
