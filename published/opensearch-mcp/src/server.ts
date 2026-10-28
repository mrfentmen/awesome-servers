// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as OS from "./opensearch.js"

export function createServer(): McpServer {
  const server = new McpServer({ name: "opensearch-mcp", version: "1.0.0" })

  server.tool("check_health", "Check the health of the OpenSearch cluster.", {}, async () => {
    try {
      const health = await OS.checkHealth()
      return { content: [{ type: "text", text: JSON.stringify(health, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Health error: ${(err as Error).message}` }] }
    }
  })

  server.tool("list_indices", "List all indices in the OpenSearch cluster.", {}, async () => {
    try {
      const indices = await OS.listIndices()
      return { content: [{ type: "text", text: JSON.stringify(indices, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool(
    "create_index",
    "Create a new index with optional settings.",
    {
      index: z.string().describe("Index name"),
      settings: z.string().optional().describe("JSON settings object (optional)"),
    },
    async (args: any) => {
      try {
        const settings = args.settings ? JSON.parse(args.settings) : undefined
        const result = await OS.createIndex(args.index, settings)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "delete_index",
    "Delete an index.",
    { index: z.string().describe("Index name to delete") },
    async (args: any) => {
      try {
        const result = await OS.deleteIndex(args.index)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_index",
    "Get information about a specific index.",
    { index: z.string().describe("Index name") },
    async (args: any) => {
      try {
        const result = await OS.getIndex(args.index)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "search_index",
    "Search for documents in an index.",
    {
      index: z.string().describe("Index name to search"),
      query: z.string().describe("Search query string"),
      limit: z.number().min(1).max(1000).optional().describe("Max results (default 20)"),
      from: z.number().min(0).optional().describe("Offset for pagination (default 0)"),
    },
    async (args: any) => {
      try {
        const result = await OS.searchIndex(args.index, args.query, args.limit ?? 20, args.from ?? 0)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "search_raw",
    "Search with raw OpenSearch query DSL (advanced usage).",
    {
      index: z.string().describe("Index name to search"),
      query: z.string().describe("Full OpenSearch query DSL as JSON string"),
    },
    async (args: any) => {
      try {
        const result = await OS.searchIndexRaw(args.index, JSON.parse(args.query))
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "index_document",
    "Add a document to an index.",
    {
      index: z.string().describe("Index name"),
      document: z.string().describe("JSON document to index"),
      id: z.string().optional().describe("Document ID (optional, auto-generated if omitted)"),
    },
    async (args: any) => {
      try {
        const doc = JSON.parse(args.document)
        const result = await OS.indexDocument(args.index, doc, args.id)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_document",
    "Retrieve a document by ID from an index.",
    {
      index: z.string().describe("Index name"),
      id: z.string().describe("Document ID"),
    },
    async (args: any) => {
      try {
        const result = await OS.getDocument(args.index, args.id)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "delete_document",
    "Delete a document by ID from an index.",
    {
      index: z.string().describe("Index name"),
      id: z.string().describe("Document ID to delete"),
    },
    async (args: any) => {
      try {
        const result = await OS.deleteDocument(args.index, args.id)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool("get_stats", "Get statistics for all indices.", {}, async () => {
    try {
      const stats = await OS.getStats()
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("get_cluster_stats", "Get cluster-wide statistics.", {}, async () => {
    try {
      const stats = await OS.getClusterStats()
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("get_tasks", "List all tasks in the cluster.", {}, async () => {
    try {
      const tasks = await OS.getTasks()
      return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool(
    "get_mappings",
    "Get mapping definitions for an index.",
    { index: z.string().describe("Index name") },
    async (args: any) => {
      try {
        const mappings = await OS.getMappings(args.index)
        return { content: [{ type: "text", text: JSON.stringify(mappings, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool("list_shards", "List all shards in the cluster.", {}, async () => {
    try {
      const shards = await OS.listShards()
      return { content: [{ type: "text", text: JSON.stringify(shards, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  server.tool("list_nodes", "List all nodes in the cluster.", {}, async () => {
    try {
      const nodes = await OS.listNodes()
      return { content: [{ type: "text", text: JSON.stringify(nodes, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
    }
  })

  return server
}
