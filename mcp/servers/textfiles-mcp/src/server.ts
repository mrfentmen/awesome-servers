import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { TextfilesError, formatEntry, listDirectory, listTopics, readTextFile, findFiles } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "textfiles-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_topics",
    {
      title: "List topics",
      description: "List the topic sections of textfiles.com (art, etext, hacking, " +
      "phreaking, 100, etc.).",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const topics = await listTopics()
        if (topics.length === 0) return text("Couldn't parse textfiles.com topics.")
        return text(
          `textfiles.com topics:\n` + topics.map((t, i) => formatEntry(t, i)).join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_files",
    {
      title: "List files",
      description: "List the files in a textfiles.com directory.",
      inputSchema: z.object(
    { dir: z.string().describe("Directory path, e.g. 'hacking' or 'phreaking'") }),
      annotations: READ_ONLY,
    },
    async ({ dir }) => {
      try {
        const files = await listDirectory(dir)
        if (files.length === 0) return text(`Nothing in textfiles.com/${dir}.`)
        return text(`textfiles.com/${dir}:\n\n${files.map((f, i) => formatEntry(f, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "read_file",
    {
      title: "Read file",
      description: "Read a text file from the archive (1980s/90s zines, docs, and net culture).",
      inputSchema: z.object(
    {
      path: z.string().describe("File path, e.g. 'hacking/phrack.txt' or '100/foo.txt'"),
      maxChars: z.number().int().min(500).max(50000).default(20000),
    }),
      annotations: READ_ONLY,
    },
    async ({ path, maxChars }) => {
      try {
        const content = await readTextFile(path, maxChars)
        if (!content.trim()) return text(`Empty file at textfiles.com/${path}.`)
        return text(content)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "archive_stats",
    {
      title: "Archive statistics",
      description: "The archive's own published size table: file count and bytes per section, how the sections rank, and the archive totals it states. Read from textfiles.com/filestats.html.",
      inputSchema: z.object({
        limit: z.number().describe("Max sections to rank, 1-40.").optional(),
        sort: z.string().describe("Rank by 'files' (default) or 'bytes'.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: archive_stats ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_textfiles_archive_stats", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "topic_profile",
    {
      title: "Section profile",
      description: "A textfiles.com section's own front page: its title, the archive's own description of it, how many files and sub-sections it lists, and the most common file extensions.",
      inputSchema: z.object(
    {
      topic: z.string().describe("Section name, e.g. hacking, phreak, magazines, ufo"),
      descriptionChars: z.number().describe("Characters of the archive's description to keep, 80-3000.").optional(),
    }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: topic_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_textfiles_topic_profile", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "find_files",
    {
      title: "Find files by name",
      description: "Search file names across several textfiles.com sections at once. With no sections named it works through the first 8 sections in the archive's own statistics table.",
      inputSchema: z.object(
    {
      query: z.string().describe("Text to look for in file names, e.g. phreaking, virus, 2600"),
      topics: z.string().describe("Comma or space separated section names, up to 8. Optional.").optional(),
      limit: z.number().describe("Max matches to print, 1-80.").optional(),
    }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await findFiles(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "grep_files",
    {
      title: "Search inside files",
      description: "Search the CONTENTS of textfiles.com files, not just their names: walks the directory listings of the sections given, downloads a bounded sample of the files they point at and reports each file that matches with its matching line numbers and the lines themselves. find_files only matches file names, so it cannot reach a document whose title says nothing about what is inside, and the archive has no search index. Wrap the query in slashes to use it as a regular expression.",
      inputSchema: z.object({
    query: z.string().describe("Text to look for inside the files, e.g. 'blue box' or '/modem.{0,20}baud/'. Wrap in slashes for a regular expression."),
    topics: z.string().describe("Comma or space separated section names, up to 8. Optional.").optional(),
    limit: z.number().describe("Max matching files to print, 1-40.").optional(),
    maxFiles: z.number().describe("Max files to download, 1-60. Default 30.").optional(),
  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: grep_files ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_textfiles_grep_files", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof TextfilesError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
