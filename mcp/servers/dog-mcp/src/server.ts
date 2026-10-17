import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { listBreeds, randomImage, breedImages, facts, randomMedia, breedGroups } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'dog-mcp', version: '1.0.0' })
  server.registerTool(
    'listBreeds',
    {
      title: "List Breeds",
      description: 'List all dog breeds from dog.ceo.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await listBreeds()) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'randomImage',
    {
      title: "Random Image",
      description: 'Random dog photo from dog.ceo, optionally by breed.',
      inputSchema: z.object( { breed: z.string().describe('Optional breed name.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await randomImage(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'breedImages',
    {
      title: "Breed Images",
      description: 'Several random photos of a specific breed.',
      inputSchema: z.object( { breed: z.string().describe('Breed name.').optional(), limit: z.number().describe('How many images.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await breedImages(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'facts',
    {
      title: "Facts",
      description: 'Random dog facts from dogapi.dog.',
      inputSchema: z.object( { limit: z.number().describe('How many facts.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await facts(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'randomMedia',
    {
      title: "Random Media",
      description: 'Random dog photo or video from random.dog.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await randomMedia()) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'breed_profile',
    {
      title: "Breed Profile",
      description: 'Full breed profile from dogapi.dog: origin, coat, life span, weights, heights, five behaviour traits, temperament and recognised bodies.',
      inputSchema: z.object( { breed: z.string().describe('Breed name like Affenpinscher.') }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement profile locally (paywall removed)
    try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    'breed_matcher',
    {
      title: "Breed Matcher",
      description: 'Filter the full breed list by hypoallergenic, maximum male weight and minimum life span.',
      inputSchema: z.object( { hypoallergenic: z.boolean().describe('Only hypoallergenic breeds, or only ones that are not.').optional(), maxWeightKg: z.number().describe('Maximum male weight in kg, 1-120.').optional(), minLifeYears: z.number().describe('Minimum life span in years, 1-30.').optional(), limit: z.number().describe('How many to list, 1-25.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement matcher locally (paywall removed)
    try { return textError("Not yet implemented: matcher") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    'breed_groups',
    {
      title: "Breed Groups",
      description: 'The dogapi.dog breed groups with their breed counts, or the members of one group.',
      inputSchema: z.object( { group: z.string().describe('Group name like Terrier.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await breedGroups(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
