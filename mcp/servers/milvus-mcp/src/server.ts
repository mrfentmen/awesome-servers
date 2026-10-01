import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { collectionStats, describeCollection, formatDescribe, formatStats, listCollections, MilvusError, vectorFootprint, searchCost, metricProbe } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "milvus-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "Milvus vector collections. Set MILVUS_URL for non-default hosts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listCollections()
        if (rows.length === 0) return text("No collections.")
        return text(rows.map((c, i) => `${i + 1}. ${c}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "describe_collection",
    {
      title: "Describe collection",
      description: "One collection: fields, types, dimension, metric.",
      inputSchema: z.object({
        name: z.string().describe("Collection name"),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        return text(formatDescribe(name, await describeCollection(name)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "collection_stats",
    {
      title: "Collection stats",
      description: "Row count and index state of one collection.",
      inputSchema: z.object({
        name: z.string().describe("Collection name"),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        return text(formatStats(name, await collectionStats(name)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "vector_footprint",
    {
      title: "Vector footprint",
      description: "Storage a vector collection will need, computed from its schema and index parameters instead of read from a running server: bytes per vector raw and as stored, graph and identifier overhead, the whole-collection total and the overhead percentage.",
      inputSchema: z.object({
        dimension: z.number().describe("Vector dimension, 1-65536."),
        rows: z.number().describe("Row count."),
        dataType: z.string().describe("Element type, e.g. FLOAT32, FLOAT16, INT8, BINARY.").optional(),
        indexType: z.string().describe("Index type, e.g. HNSW, IVF_FLAT, IVF_SQ8, IVF_PQ, DISKANN, FLAT.").optional(),
        m: z.number().describe("Graph degree M for HNSW style indexes.").optional(),
        nlist: z.number().describe("Inverted file list count for IVF style indexes.").optional(),
        subVectors: z.number().describe("Product quantiser sub-vector count for IVF_PQ.").optional(),
        bitsPerCode: z.number().describe("Bits per product quantiser code for IVF_PQ.").optional(),
        primaryKeyBytes: z.number().describe("Bytes per primary key, default 8 for a 64 bit key.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: vector_footprint ----
      const paywallMessage = await premiumRequired("vector_footprint")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await vectorFootprint(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_cost",
    {
      title: "Search cost",
      description: "What an approximate index's own parameters imply per query: list sizes and vectors scanned for IVF, candidate list and graph memory for HNSW, and the recall those parameters trade for. Arithmetic from the parameters, not a measured speed.",
      inputSchema: z.object({
        indexType: z.string().describe("Index type, e.g. HNSW, IVF_FLAT, IVF_SQ8.").optional(),
        numVectors: z.number().describe("Vectors in the collection.").optional(),
        dimension: z.number().describe("Vector dimension.").optional(),
        nlist: z.number().describe("Inverted file list count.").optional(),
        nprobe: z.number().describe("Lists probed per query.").optional(),
        m: z.number().describe("Graph degree M for HNSW style indexes.").optional(),
        efConstruction: z.number().describe("Candidate list used while building an HNSW graph.").optional(),
        efSearch: z.number().describe("Candidate list used while searching an HNSW graph.").optional(),
        dataType: z.string().describe("Element type, e.g. FLOAT32.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: search_cost ----
      const paywallMessage = await premiumRequired("search_cost")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await searchCost(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "metric_probe",
    {
      title: "Metric probe",
      description: "Score real candidate vectors against a query under L2, IP, COSINE, HAMMING or JACCARD, computed exactly, so a metric choice can be compared on real numbers rather than assumed.",
      inputSchema: z.object({
        metric: z.string().describe("L2, IP, COSINE, HAMMING or JACCARD.").optional(),
        query: z.array(z.number()).describe("The query vector."),
        candidates: z.array(z.array(z.number())).describe("Candidate vectors, same dimension as the query, up to 20."),
        limit: z.number().describe("Candidates to rank, 1-20.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await metricProbe(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MilvusError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
