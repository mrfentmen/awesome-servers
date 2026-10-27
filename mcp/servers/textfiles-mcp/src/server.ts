import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  TextfilesError,
  formatEntry,
  listDirectory,
  listTopics,
  readTextFile,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "textfiles-mcp",
    version: "1.0.0",
  })

  server.tool(
    "list_topics",
    "List the topic sections of textfiles.com (art, etext, hacking, " +
      "phreaking, 100, etc.).",
    {},
    async () => {
      try {
        const topics = await listTopics()
        if (topics.length === 0) return text("Couldn't parse textfiles.com topics.")
        return text(
          `textfiles.com topics:\n` + topics.map((t, i) => formatEntry(t, i)).join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_files",
    "List the files in a textfiles.com directory.",
    { dir: z.string().describe("Directory path, e.g. 'hacking' or 'phreaking'") },
    async ({ dir }) => {
      try {
        const files = await listDirectory(dir)
        if (files.length === 0) return text(`Nothing in textfiles.com/${dir}.`)
        return text(`textfiles.com/${dir}:\n\n${files.map((f, i) => formatEntry(f, i)).join("\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "read_file",
    "Read a text file from the archive (1980s/90s zines, docs, and net culture).",
    {
      path: z.string().describe("File path, e.g. 'hacking/phrack.txt' or '100/foo.txt'"),
      maxChars: z.number().int().min(500).max(50000).default(20000),
    },
    async ({ path, maxChars }) => {
      try {
        const content = await readTextFile(path, maxChars)
        if (!content.trim()) return text(`Empty file at textfiles.com/${path}.`)
        return text(content)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof TextfilesError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
