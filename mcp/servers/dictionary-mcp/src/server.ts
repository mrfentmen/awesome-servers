import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_define, m0_wordOfDay, m1_randomWord, m1_wordOfTheDay, wordPhonetics } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'dictionary-mcp', version: '1.0.0' })
server.registerTool(
    "define",
    {
      title: "Define",
      description: "Get the definition of a word.",
      inputSchema: z.object( { word: z.string().describe("Word to look up.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_define(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "word_of_day",
    {
      title: "Word of day",
      description: "Get a random word with its definition.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_wordOfDay(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "word_of_the_day",
    {
      title: "Word of the day",
      description: "Get the featured word of the day.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_wordOfTheDay(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "random_word",
    {
      title: "Random word",
      description: "Get a random word with its definition.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_randomWord(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "word_relations",
    {
      title: "Word relations",
      description: "The synonyms and antonyms a dictionary entry holds, gathered from every part of speech and from every individual definition and deduped, with the count per part of speech, how many definitions carry an example, and the entry's licence and sources. The define tool prints definitions and examples and never reads any of this.",
      inputSchema: z.object( { word: z.string().describe("Word to look up, like cat.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement relations locally (paywall removed)
    try { return textError("Not yet implemented: relations") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "word_phonetics",
    {
      title: "Word phonetics",
      description: "Every pronunciation a dictionary entry records, deduped, with each one's audio file, the source it was recorded from and its own licence, plus the headword phonetic. The existing tools print at most a comma joined list of the phonetic text, with no audio and no licence.",
      inputSchema: z.object( { word: z.string().describe("Word to look up, like cat.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await wordPhonetics(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
