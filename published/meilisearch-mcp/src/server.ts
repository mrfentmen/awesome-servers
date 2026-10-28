// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as MS from "./meilisearch.js"

export function createServer(): McpServer {
  const server = new McpServer({ name: "meilisearch-mcp", version: "1.0.0" })

  server.tool("check_health", "Check if the MeiliSearch server is running and healthy.", {}, async () => {
    try {
      const health = await MS.checkHealth()
      return { content: [{ type: "text", text: JSON.stringify(health, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Health check error: ${(err as Error).message}` }] }
    }
  })

  server.tool(
    "list_indexes",
    "List all MeiliSearch indexes.",
    { limit: z.number().min(1).max(100).optional().describe("Max indexes to return") },
    async (args: any) => {
      try {
        const indexes = await MS.listIndexes()
        return { content: [{ type: "text", text: JSON.stringify(indexes, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_index",
    "Get details about a specific MeiliSearch index.",
    { index_uid: z.string().describe("The index UID") },
    async (args: any) => {
      try {
        const index = await MS.getIndex(args.index_uid)
        return { content: [{ type: "text", text: JSON.stringify(index, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "create_index",
    "Create a new MeiliSearch index.",
    {
      uid: z.string().describe("Unique index identifier"),
      primary_key: z.string().optional().describe("Primary key for documents (default: id)"),
    },
    async (args: any) => {
      try {
        const result = await MS.createIndex(args.uid, args.primary_key)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "delete_index",
    "Delete a MeiliSearch index.",
    { index_uid: z.string().describe("The index UID to delete") },
    async (args: any) => {
      try {
        const result = await MS.deleteIndex(args.index_uid)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "search_index",
    "Search for documents in a MeiliSearch index.",
    {
      index_uid: z.string().describe("The index UID to search in"),
      query: z.string().describe("Search query string"),
      limit: z.number().min(1).max(1000).optional().describe("Max results to return (default 20)"),
      offset: z.number().min(0).optional().describe("Number of results to skip"),
      filter: z.string().optional().describe("Filter expression (e.g., price > 100)"),
    },
    async (args: any) => {
      try {
        const result = await MS.searchIndex(args.index_uid, args.query, args.limit ?? 20, args.offset, args.filter)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_documents",
    "List documents in a MeiliSearch index.",
    {
      index_uid: z.string().describe("The index UID"),
      limit: z.number().min(1).max(1000).optional().describe("Max documents to return (default 20)"),
      offset: z.number().min(0).optional().describe("Number of documents to skip (default 0)"),
    },
    async (args: any) => {
      try {
        const docs = await MS.getDocuments(args.index_uid, args.limit ?? 20, args.offset ?? 0)
        return { content: [{ type: "text", text: JSON.stringify(docs, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_document",
    "Get a single document by ID from a MeiliSearch index.",
    {
      index_uid: z.string().describe("The index UID"),
      id: z.string().describe("The document ID"),
    },
    async (args: any) => {
      try {
        const doc = await MS.getDocument(args.index_uid, args.id)
        return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "add_documents",
    "Add documents to a MeiliSearch index. Accepts a JSON array of document objects.",
    {
      index_uid: z.string().describe("The index UID"),
      documents: z.string().describe('JSON array of documents, e.g. [{"id":"1","title":"Doc"}]'),
    },
    async (args: any) => {
      try {
        const docs = JSON.parse(args.documents)
        if (!Array.isArray(docs)) throw new Error("Documents must be a JSON array")
        const result = await MS.addDocuments(args.index_uid, docs)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "delete_document",
    "Delete a document by ID from a MeiliSearch index.",
    {
      index_uid: z.string().describe("The index UID"),
      id: z.string().describe("The document ID to delete"),
    },
    async (args: any) => {
      try {
        const result = await MS.deleteDocument(args.index_uid, args.id)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool("get_stats", "Get statistics about the MeiliSearch instance.", {}, async () => {
    try {
      const stats = await MS.getStats()
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool(
    "get_index_stats",
    "Get statistics for a specific index.",
    { index_uid: z.string().describe("The index UID") },
    async (args: any) => {
      try {
        const stats = await MS.getIndexStats(args.index_uid)
        return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_task",
    "Get the status of an asynchronous task.",
    { task_uid: z.string().describe("The task UID") },
    async (args: any) => {
      try {
        const task = await MS.getTask(args.task_uid)
        return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool("list_keys", "List all API keys for the MeiliSearch instance.", {}, async () => {
    try {
      const keys = await MS.listKeys()
      return { content: [{ type: "text", text: JSON.stringify(keys, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool(
    "update_settings",
    "Update settings for a MeiliSearch index (searchable attributes, filterable, sortable, ranking rules, etc).",
    {
      index_uid: z.string().describe("The index UID"),
      settings: z.string().describe("JSON settings object (see MeiliSearch settings API)"),
    },
    async (args: any) => {
      try {
        const settings = JSON.parse(args.settings)
        const result = await MS.updateSettings(args.index_uid, settings)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  return server
}
