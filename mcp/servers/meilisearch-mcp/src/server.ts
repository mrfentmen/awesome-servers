// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as MS from "./meilisearch.js"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "meilisearch-mcp", version: "1.0.0" })

  server.registerTool(
    "check_health",
    {
      title: "Check health",
      description: "Check if the MeiliSearch server is running and healthy.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const health = await MS.checkHealth()
      return { content: [{ type: "text", text: JSON.stringify(health, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Health check error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  server.registerTool(
    "list_indexes",
    {
      title: "List indexes",
      description: "List all MeiliSearch indexes.",
      inputSchema: z.object(
    { limit: z.number().min(1).max(100).optional().describe("Max indexes to return") }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const indexes = await MS.listIndexes()
        return { content: [{ type: "text", text: JSON.stringify(indexes, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_index",
    {
      title: "Get index",
      description: "Get details about a specific MeiliSearch index.",
      inputSchema: z.object(
    { index_uid: z.string().describe("The index UID") }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const index = await MS.getIndex(args.index_uid)
        return { content: [{ type: "text", text: JSON.stringify(index, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "create_index",
    {
      title: "Create index",
      description: "Create a new MeiliSearch index.",
      inputSchema: z.object(
    {
      uid: z.string().describe("Unique index identifier"),
      primary_key: z.string().optional().describe("Primary key for documents (default: id)"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const result = await MS.createIndex(args.uid, args.primary_key)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "delete_index",
    {
      title: "Delete index",
      description: "Delete a MeiliSearch index.",
      inputSchema: z.object(
    { index_uid: z.string().describe("The index UID to delete") }),
      annotations: DESTRUCTIVE,
    },
    async (args: any) => {
      try {
        const result = await MS.deleteIndex(args.index_uid)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "search_index",
    {
      title: "Search index",
      description: "Search for documents in a MeiliSearch index.",
      inputSchema: z.object(
    {
      index_uid: z.string().describe("The index UID to search in"),
      query: z.string().describe("Search query string"),
      limit: z.number().min(1).max(1000).optional().describe("Max results to return (default 20)"),
      offset: z.number().min(0).optional().describe("Number of results to skip"),
      filter: z.string().optional().describe("Filter expression (e.g., price > 100)"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await MS.searchIndex(args.index_uid, args.query, args.limit ?? 20, args.offset, args.filter)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_documents",
    {
      title: "Get documents",
      description: "List documents in a MeiliSearch index.",
      inputSchema: z.object(
    {
      index_uid: z.string().describe("The index UID"),
      limit: z.number().min(1).max(1000).optional().describe("Max documents to return (default 20)"),
      offset: z.number().min(0).optional().describe("Number of documents to skip (default 0)"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const docs = await MS.getDocuments(args.index_uid, args.limit ?? 20, args.offset ?? 0)
        return { content: [{ type: "text", text: JSON.stringify(docs, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_document",
    {
      title: "Get document",
      description: "Get a single document by ID from a MeiliSearch index.",
      inputSchema: z.object(
    {
      index_uid: z.string().describe("The index UID"),
      id: z.string().describe("The document ID"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const doc = await MS.getDocument(args.index_uid, args.id)
        return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "add_documents",
    {
      title: "Add documents",
      description: "Add documents to a MeiliSearch index. Accepts a JSON array of document objects.",
      inputSchema: z.object(
    {
      index_uid: z.string().describe("The index UID"),
      documents: z.string().describe('JSON array of documents, e.g. [{"id":"1","title":"Doc"}]'),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const docs = JSON.parse(args.documents)
        if (!Array.isArray(docs)) throw new Error("Documents must be a JSON array")
        const result = await MS.addDocuments(args.index_uid, docs)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "delete_document",
    {
      title: "Delete document",
      description: "Delete a document by ID from a MeiliSearch index.",
      inputSchema: z.object(
    {
      index_uid: z.string().describe("The index UID"),
      id: z.string().describe("The document ID to delete"),
    }),
      annotations: DESTRUCTIVE,
    },
    async (args: any) => {
      try {
        const result = await MS.deleteDocument(args.index_uid, args.id)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_stats",
    {
      title: "Get stats",
      description: "Get statistics about the MeiliSearch instance.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const stats = await MS.getStats()
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  server.registerTool(
    "get_index_stats",
    {
      title: "Get index stats",
      description: "Get statistics for a specific index.",
      inputSchema: z.object(
    { index_uid: z.string().describe("The index UID") }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const stats = await MS.getIndexStats(args.index_uid)
        return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_task",
    {
      title: "Get task",
      description: "Get the status of an asynchronous task.",
      inputSchema: z.object(
    { task_uid: z.string().describe("The task UID") }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const task = await MS.getTask(args.task_uid)
        return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "list_keys",
    {
      title: "List keys",
      description: "List all API keys for the MeiliSearch instance.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const keys = await MS.listKeys()
      return { content: [{ type: "text", text: JSON.stringify(keys, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  server.registerTool(
    "update_settings",
    {
      title: "Update settings",
      description: "Update settings for a MeiliSearch index (searchable attributes, filterable, sortable, ranking rules, etc).",
      inputSchema: z.object(
    {
      index_uid: z.string().describe("The index UID"),
      settings: z.string().describe("JSON settings object (see MeiliSearch settings API)"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const settings = JSON.parse(args.settings)
        const result = await MS.updateSettings(args.index_uid, settings)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  return server
}
