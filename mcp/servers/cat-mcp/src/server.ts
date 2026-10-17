import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { fact, breeds, breedInfo, photo, searchImages, popularCatTags } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'cat-mcp', version: '1.0.0' })
  server.registerTool(
    'fact',
    {
      title: "Fact",
      description: 'Random cat fact from Cat Facts.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await fact()) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'breeds',
    {
      title: "Breeds",
      description: 'List cat breeds from Cat Facts.',
      inputSchema: z.object( { limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await breeds(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'breedInfo',
    {
      title: "Breed Info",
      description: 'Detailed breed info from TheCatAPI by breed id.',
      inputSchema: z.object( { breed_id: z.string().describe('Breed id or name.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await breedInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'photo',
    {
      title: "Photo",
      description: 'Random cat photo from Cataas, optionally by tag.',
      inputSchema: z.object( { tag: z.string().describe('Optional tag filter.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await photo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'searchImages',
    {
      title: "Search Images",
      description: 'Fetch several random cat photos, optionally by tag.',
      inputSchema: z.object( { tag: z.string().describe('Optional tag filter.').optional(), limit: z.number().describe('How many photos.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchImages(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'cat_photos_by_tag',
    {
      title: "Cat photos by tag",
      description: 'Browse cat photos from Cataas that carry a tag, with their ids, type and date.',
      inputSchema: z.object( { tag: z.string().describe('Tag to browse, e.g. "cute".'), limit: z.number().describe('Max photos.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement tag locally (paywall removed)
    try { return textError("Not yet implemented: tag") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    'cat_photo_by_id',
    {
      title: "Cat photo by id",
      description: 'Fetch one known Cataas cat by its id, with tags, type and date.',
      inputSchema: z.object( { cat_id: z.string().describe('Cat id from cat_photos_by_tag.') }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement id locally (paywall removed)
    try { return textError("Not yet implemented: id") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    'popular_cat_tags',
    {
      title: "Popular cat tags",
      description: 'The tag list Cataas indexes its cat photos by, optionally filtered by substring.',
      inputSchema: z.object( { limit: z.number().describe('Max tags to list.').optional(), filter: z.string().describe('Only tags containing this.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await popularCatTags(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
