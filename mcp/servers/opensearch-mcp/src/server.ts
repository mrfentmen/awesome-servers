// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as OS from "./opensearch.js"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "opensearch-mcp", version: "1.0.0" })

  server.registerTool(
    "check_health",
    {
      title: "Check health",
      description: "Check the health of the OpenSearch cluster.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const health = await OS.checkHealth()
      return { content: [{ type: "text", text: JSON.stringify(health, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Health error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  server.registerTool(
    "list_indices",
    {
      title: "List indices",
      description: "List all indices in the OpenSearch cluster.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const indices = await OS.listIndices()
      return { content: [{ type: "text", text: JSON.stringify(indices, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  server.registerTool(
    "create_index",
    {
      title: "Create index",
      description: "Create a new index with optional settings.",
      inputSchema: z.object(
    {
      index: z.string().describe("Index name"),
      settings: z.string().optional().describe("JSON settings object (optional)"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const settings = args.settings ? JSON.parse(args.settings) : undefined
        const result = await OS.createIndex(args.index, settings)
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
      description: "Delete an index.",
      inputSchema: z.object(
    { index: z.string().describe("Index name to delete") }),
      annotations: DESTRUCTIVE,
    },
    async (args: any) => {
      try {
        const result = await OS.deleteIndex(args.index)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_index",
    {
      title: "Get index",
      description: "Get information about a specific index.",
      inputSchema: z.object(
    { index: z.string().describe("Index name") }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await OS.getIndex(args.index)
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
      description: "Search for documents in an index.",
      inputSchema: z.object(
    {
      index: z.string().describe("Index name to search"),
      query: z.string().describe("Search query string"),
      limit: z.number().min(1).max(1000).optional().describe("Max results (default 20)"),
      from: z.number().min(0).optional().describe("Offset for pagination (default 0)"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await OS.searchIndex(args.index, args.query, args.limit ?? 20, args.from ?? 0)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "search_raw",
    {
      title: "Search raw",
      description: "Search with raw OpenSearch query DSL (advanced usage).",
      inputSchema: z.object(
    {
      index: z.string().describe("Index name to search"),
      query: z.string().describe("Full OpenSearch query DSL as JSON string"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await OS.searchIndexRaw(args.index, JSON.parse(args.query))
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "index_document",
    {
      title: "Index document",
      description: "Add a document to an index.",
      inputSchema: z.object(
    {
      index: z.string().describe("Index name"),
      document: z.string().describe("JSON document to index"),
      id: z.string().optional().describe("Document ID (optional, auto-generated if omitted)"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const doc = JSON.parse(args.document)
        const result = await OS.indexDocument(args.index, doc, args.id)
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_document",
    {
      title: "Get document",
      description: "Retrieve a document by ID from an index.",
      inputSchema: z.object(
    {
      index: z.string().describe("Index name"),
      id: z.string().describe("Document ID"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const result = await OS.getDocument(args.index, args.id)
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
      description: "Delete a document by ID from an index.",
      inputSchema: z.object(
    {
      index: z.string().describe("Index name"),
      id: z.string().describe("Document ID to delete"),
    }),
      annotations: DESTRUCTIVE,
    },
    async (args: any) => {
      try {
        const result = await OS.deleteDocument(args.index, args.id)
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
      description: "Get statistics for all indices.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const stats = await OS.getStats()
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  server.registerTool(
    "get_cluster_stats",
    {
      title: "Get cluster stats",
      description: "Get cluster-wide statistics.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const stats = await OS.getClusterStats()
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  server.registerTool(
    "get_tasks",
    {
      title: "Get tasks",
      description: "List all tasks in the cluster.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const tasks = await OS.getTasks()
      return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  server.registerTool(
    "get_mappings",
    {
      title: "Get mappings",
      description: "Get mapping definitions for an index.",
      inputSchema: z.object(
    { index: z.string().describe("Index name") }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const mappings = await OS.getMappings(args.index)
        return { content: [{ type: "text", text: JSON.stringify(mappings, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "list_shards",
    {
      title: "List shards",
      description: "List all shards in the cluster.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const shards = await OS.listShards()
      return { content: [{ type: "text", text: JSON.stringify(shards, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  server.registerTool(
    "list_nodes",
    {
      title: "List nodes",
      description: "List all nodes in the cluster.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try {
      const nodes = await OS.listNodes()
      return { content: [{ type: "text", text: JSON.stringify(nodes, null, 2) }] }
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
    }
  }
  )

  return server
}
