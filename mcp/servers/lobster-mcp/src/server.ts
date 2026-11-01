import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { LOBSTER, checkToolchain, formatResult, formatStatus, runProgram } from "./runner.js"
import {
  formatBuiltinLookup,
  formatBuiltinSearch,
  formatCategories,
  formatCategory,
  formatCheatsheet,
  formatDocSearch,
  formatDocs,
  formatKeywords,
  formatOverview,
  formatSample,
  formatSampleList,
  formatSampleSearch,
  formatSection,
  formatSections,
} from "./data.js"

function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] }
}

function fail(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "lobster-mcp", version: "1.1.0" })

  server.tool(
    "overview",
    "What this server knows about Lobster: source repo and commit, document list, and how many builtins, keywords and samples are bundled.",
    {},
    async () => {
      try {
        return text(formatOverview())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_docs",
    "List the Lobster documentation documents with their section counts.",
    {},
    async () => {
      try {
        return text(formatDocs())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_sections",
    "List documentation sections (id + title) for every document, or for one document.",
    {
      doc: z
        .string()
        .optional()
        .describe("Document id such as language_reference, language_spec, memory_management or cheat_sheet."),
    },
    async ({ doc }) => {
      try {
        return text(formatSections(doc))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_section",
    "Read one documentation section in full by its id (ids come from list_sections or search_docs).",
    { id: z.string().min(1).describe("Section id, for example language_reference#4.") },
    async ({ id }) => {
      try {
        return text(formatSection(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_docs",
    "Full-text search over every Lobster document. Title matches rank first, with a snippet from the body.",
    {
      query: z.string().min(1).describe("Word or phrase to look for, e.g. \"memory management\" or \"switch\"."),
      limit: z.number().int().min(1).max(20).optional().describe("How many results to return (default 5)."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatDocSearch(query, limit ?? 5))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "lookup_builtin",
    "Look up a Lobster builtin function by exact name, showing every overload, its signature, category and description.",
    { name: z.string().min(1).describe("Builtin name exactly as written in Lobster, e.g. print, map, length.") },
    async ({ name }) => {
      try {
        return text(formatBuiltinLookup(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_builtins",
    "Search the 879 Lobster builtin functions by name or description, optionally within one category.",
    {
      query: z.string().min(1).describe("Text to match against builtin names and descriptions."),
      category: z
        .string()
        .optional()
        .describe("Restrict to one category such as builtin, graphics, imgui, file, sound, physics, meshgen."),
      limit: z.number().int().min(1).max(50).optional().describe("How many results to return (default 10)."),
    },
    async ({ query, category, limit }) => {
      try {
        return text(formatBuiltinSearch(query, category, limit ?? 10))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_builtin_categories",
    "List the Lobster builtin categories with the number of functions in each.",
    {},
    async () => {
      try {
        return text(formatCategories())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_builtins_in_category",
    "List every builtin signature and description inside one category.",
    { category: z.string().min(1).describe("Category name, e.g. graphics or builtin (case-insensitive).") },
    async ({ category }) => {
      try {
        return text(formatCategory(category))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_keywords",
    "List Lobster's reserved keywords grouped by kind (type, declaration, control, module, operator, literal, expression).",
    {
      kind: z
        .string()
        .optional()
        .describe("Only show one kind, for example declaration or control."),
    },
    async ({ kind }) => {
      try {
        return text(formatKeywords(kind))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_cheatsheet",
    "The full \"C-style language cheat sheet for Lobster\" from the official docs, useful for translating code from C, C#, Java or JavaScript.",
    {},
    async () => {
      try {
        return text(formatCheatsheet())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_samples",
    "List the bundled real Lobster sample programs with their size and repository path.",
    {},
    async () => {
      try {
        return text(formatSampleList())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_sample",
    "Return the source of one sample program, matched case-insensitively with or without the .lobster extension.",
    { name: z.string().min(1).describe("Sample name, e.g. cube.lobster or knights_tour.") },
    async ({ name }) => {
      try {
        return text(formatSample(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_samples",
    "Search inside the bundled sample programs for a piece of Lobster code.",
    {
      query: z.string().min(1).describe("Substring to find in the sample source, e.g. \"for(\" or \"gl.window\"."),
      limit: z.number().int().min(1).max(20).optional().describe("How many samples to return (default 5)."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSampleSearch(query, limit ?? 5))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "toolchain_status",
    "Check whether the Lobster toolchain is installed and reachable. Reports the binary it would use (LOBSTER_BIN or `lobster` on PATH) without compiling anything.",
    {},
    async () => {
      try {
        return text(formatStatus(LOBSTER, checkToolchain(LOBSTER)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "run_code",
    "Compile and run a Lobster program with the locally installed toolchain. Writes the code to a temporary directory, runs `lobster main.lobster` there, and returns the exit code, stdout and stderr. Requires Lobster to be installed on the machine (see toolchain_status). Times out after 10s by default and the reference data never leaves the machine.",
    {
      code: z.string().min(1).describe("Complete Lobster source code to compile and run."),
      args: z
        .array(z.string())
        .optional()
        .describe("Arguments passed to the program after `--` (Lobster exposes them via command_line_arguments())."),
      timeoutMs: z
        .number()
        .int()
        .min(100)
        .max(60000)
        .optional()
        .describe("Kill the process after this many milliseconds. Default 10000, max 60000."),
    },
    async ({ code, args, timeoutMs }) => {
      try {
        return text(
          formatResult(
            await runProgram(LOBSTER, {
              code,
              ...(args ? { args } : {}),
              ...(timeoutMs !== undefined ? { timeoutMs } : {}),
            })
          )
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
