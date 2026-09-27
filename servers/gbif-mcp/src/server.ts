import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { countries, dataset, format, installations, match, nodes, occurrences, occurrenceCount, organizations, species, speciesSearch, GbifError } from "./api.js"
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer() { const server = new McpServer({ name: "gbif-mcp", version: "1.0.0" }); server.registerTool(
    "match_species",
    {
      title: "Match species",
      description: "Match a scientific or common name to GBIF taxonomy.",
      inputSchema: z.object( { name: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ name }) => { try { return text(format(await match(name))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "get_species",
    {
      title: "Get species",
      description: "Get GBIF taxonomy metadata by usage key.",
      inputSchema: z.object( { key: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ key }) => { try { return text(format(await species(key))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "search_occurrences",
    {
      title: "Search occurrences",
      description: "Search public biodiversity observations by taxon, country, year, or bounding box.",
      inputSchema: z.object( { taxonKey: z.string().optional(), country: z.string().length(2).optional(), year: z.string().optional(), geometry: z.string().optional(), limit: z.number().int().min(1).max(100).default(20) }),
      annotations: READ_ONLY,
    },
    async ({ taxonKey, country, year, geometry, limit }) => { try { return text(format(await occurrences({ ...(taxonKey ? { taxonKey } : {}), ...(country ? { country } : {}), ...(year ? { year } : {}), ...(geometry ? { geometry } : {}), limit: String(limit) }))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "search_species",
    {
      title: "Search species",
      description: "Full-text species search.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(50).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { return text(format(await speciesSearch(query, limit))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "occurrence_count",
    {
      title: "Occurrence count",
      description: "How many observations for a taxon key.",
      inputSchema: z.object( { taxonKey: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ taxonKey }) => { try { return text(format(await occurrenceCount(taxonKey))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "list_countries",
    {
      title: "List countries",
      description: "ISO country enumeration.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async () => { try { return text(format(await countries())) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "list_organizations",
    {
      title: "List organizations",
      description: "GBIF data publishers.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(50).default(5) }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => { try { return text(format(await organizations(limit))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "list_installations",
    {
      title: "List installations",
      description: "GBIF installations.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(50).default(5) }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => { try { return text(format(await installations(limit))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "list_nodes",
    {
      title: "List nodes",
      description: "GBIF country nodes.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(50).default(5) }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => { try { return text(format(await nodes(limit))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); server.registerTool(
    "get_dataset",
    {
      title: "Get dataset",
      description: "Dataset metadata by key.",
      inputSchema: z.object( { key: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ key }) => { try { return text(format(await dataset(key))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  ); return server }
export { GbifError }
