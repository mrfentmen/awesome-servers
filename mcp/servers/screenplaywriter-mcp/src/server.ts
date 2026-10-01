import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { writeFile, mkdir, readFile } from "node:fs/promises"
import { dirname } from "node:path"
import { astToFountain, estimateRuntime, getSceneBreakdown, parseFountain, sceneToFountain } from "./parser.js"
import type { SceneNode, ScreenplayAST } from "./types.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const errorMessage = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

const store = new Map<string, ScreenplayAST>()

export function createServer(): McpServer {
  const server = new McpServer({ name: "screenplaywriter", version: "1.0.0" })

  server.registerTool(
    "parse_screenplay",
    {
      title: "Parse screenplay",
      description: "Parse a Fountain screenplay from text or file into a structured AST. This is the first step before any analysis or editing.",
      inputSchema: z.object(
    {
      content: z.string().describe("The Fountain screenplay text content"),
      name: z.string().optional().describe("Name to store the parsed screenplay under for later reference"),
    }),
      annotations: READ_ONLY,
    },
    // @ts-ignore - SDK overload resolution depth
    async (args: { content: string; name?: string }) => {
      try {
        const ast = parseFountain(args.content)
        const id = args.name || `screenplay_${Date.now()}`
        store.set(id, ast)

        const runtime = estimateRuntime(ast)
        const chars = Array.from(ast.characters.keys())

        const text = [
          `# Screenplay Parsed: ${id}`,
          ast.title ? `**Title:** ${ast.title}` : "",
          `**Scenes:** ${ast.scenes.length}`,
          `**Characters:** ${chars.length}`,
          `**Estimated runtime:** ${runtime.pages} pages / ~${runtime.minutes} minutes`,
          "",
          `**Characters:** ${chars.join(", ")}`,
          "",
          `**Scenes:**`,
          ...ast.scenes.map((s, i) => `${i + 1}. ${s.text}`),
        ]
          .filter(Boolean)
          .join("\n")

        return { content: [{ type: "text" as const, text }] }
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Parse error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "load_screenplay_file",
    {
      title: "Load screenplay file",
      description: "Load a Fountain screenplay from a file path on disk and parse it.",
      inputSchema: z.object(
    {
      path: z.string().describe("Path to the .fountain file"),
      name: z.string().optional().describe("Name to store under"),
    }),
      annotations: READ_ONLY,
    },
    async (args: { path: string; name?: string }) => {
      try {
        const content = await readFile(args.path, "utf-8")
        const ast = parseFountain(content)
        const id = args.name || args.path
        store.set(id, ast)

        const runtime = estimateRuntime(ast)
        const chars = Array.from(ast.characters.keys())

        return {
          content: [
            {
              type: "text" as const,
              text: `Loaded "${id}"\nScenes: ${ast.scenes.length}\nCharacters: ${chars.join(", ")}\nEst. runtime: ~${runtime.minutes} min`,
            },
          ],
        }
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "write_screenplay",
    {
      title: "Write screenplay",
      description: "Write a new screenplay in Fountain format. The LLM should provide proper Fountain syntax. Saves to disk.",
      inputSchema: z.object(
    {
      filename: z.string().describe("Output filename (e.g., 'my_screenplay.fountain')"),
      content: z.string().describe("The screenplay in Fountain format"),
      output_dir: z.string().describe("Directory to save to"),
    }),
      annotations: WRITE,
    },
    async (args: { filename: string; content: string; output_dir: string }) => {
      try {
        await mkdir(args.output_dir, { recursive: true })
        const filepath = `${args.output_dir}/${args.filename}`
        await writeFile(filepath, args.content, "utf-8")

        const ast = parseFountain(args.content)
        const runtime = estimateRuntime(ast)

        return {
          content: [
            {
              type: "text" as const,
              text: `Written to ${filepath}\n\nScenes: ${ast.scenes.length}\nCharacters: ${Array.from(ast.characters.keys()).join(", ")}\nEst. runtime: ~${runtime.minutes} minutes (${runtime.pages} pages)`,
            },
          ],
        }
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_scene",
    {
      title: "Get scene",
      description: "Get a specific scene from a stored screenplay by number.",
      inputSchema: z.object(
    {
      screenplay_id: z.string().describe("The screenplay name/ID from parse_screenplay"),
      scene_number: z.number().describe("Scene number (1-indexed)"),
    }),
      annotations: READ_ONLY,
    },
    async (args: { screenplay_id: string; scene_number: number }) => {
      const ast = store.get(args.screenplay_id)
      if (!ast) return { content: [{ type: "text" as const, text: `Screenplay "${args.screenplay_id}" not found` }] }

      const scene = ast.scenes[args.scene_number - 1]
      if (!scene) {
        return {
          content: [
            { type: "text" as const, text: `Scene ${args.scene_number} not found. Total: ${ast.scenes.length}` },
          ],
        }
      }

      return { content: [{ type: "text" as const, text: sceneToFountain(scene) }] }
    }
  )

  server.registerTool(
    "edit_scene",
    {
      title: "Edit scene",
      description: "Replace a scene in a stored screenplay. Writes the modified screenplay to disk.",
      inputSchema: z.object(
    {
      screenplay_id: z.string().describe("The screenplay name/ID"),
      scene_number: z.number().describe("Scene number to replace"),
      new_content: z.string().describe("New scene in Fountain format (including heading)"),
      output_path: z.string().describe("Where to save the modified screenplay"),
    }),
      annotations: WRITE,
    },
    async (args: { screenplay_id: string; scene_number: number; new_content: string; output_path: string }) => {
      const ast = store.get(args.screenplay_id)
      if (!ast) return { content: [{ type: "text" as const, text: `Screenplay not found` }] }

      const idx = args.scene_number - 1
      if (idx < 0 || idx >= ast.scenes.length) {
        return { content: [{ type: "text" as const, text: `Invalid scene number` }] }
      }

      const newScene = parseFountain(args.new_content).scenes[0]
      if (!newScene) return { content: [{ type: "text" as const, text: "Could not parse new scene" }] }

      ast.scenes[idx] = newScene

      const fountain = astToFountain(ast)
      await mkdir(dirname(args.output_path), { recursive: true })
      await writeFile(args.output_path, fountain, "utf-8")

      return {
        content: [{ type: "text" as const, text: `Scene ${args.scene_number} updated. Saved to ${args.output_path}` }],
      }
    }
  )

  server.registerTool(
    "add_scene",
    {
      title: "Add scene",
      description: "Add a new scene to a stored screenplay. Writes the modified screenplay to disk.",
      inputSchema: z.object(
    {
      screenplay_id: z.string().describe("The screenplay name/ID"),
      after_scene: z.number().describe("Insert after this scene number (0 = beginning)"),
      scene_content: z.string().describe("New scene in Fountain format (including heading)"),
      output_path: z.string().describe("Where to save the modified screenplay"),
    }),
      annotations: WRITE,
    },
    async (args: { screenplay_id: string; after_scene: number; scene_content: string; output_path: string }) => {
      const ast = store.get(args.screenplay_id)
      if (!ast) return { content: [{ type: "text" as const, text: `Screenplay not found` }] }

      const newScene = parseFountain(args.scene_content).scenes[0]
      if (!newScene) return { content: [{ type: "text" as const, text: "Could not parse new scene" }] }

      ast.scenes.splice(args.after_scene, 0, newScene)

      const fountain = astToFountain(ast)
      await mkdir(dirname(args.output_path), { recursive: true })
      await writeFile(args.output_path, fountain, "utf-8")

      return {
        content: [
          {
            type: "text" as const,
            text: `Scene added after #${args.after_scene}. Total: ${ast.scenes.length}. Saved to ${args.output_path}`,
          },
        ],
      }
    }
  )

  server.registerTool(
    "remove_scene",
    {
      title: "Remove scene",
      description: "Remove a scene from a stored screenplay.",
      inputSchema: z.object(
    {
      screenplay_id: z.string().describe("The screenplay name/ID"),
      scene_number: z.number().describe("Scene number to remove"),
      output_path: z.string().describe("Where to save the modified screenplay"),
    }),
      annotations: WRITE,
    },
    async (args: { screenplay_id: string; scene_number: number; output_path: string }) => {
      const ast = store.get(args.screenplay_id)
      if (!ast) return { content: [{ type: "text" as const, text: `Screenplay not found` }] }

      const idx = args.scene_number - 1
      if (idx < 0 || idx >= ast.scenes.length) {
        return { content: [{ type: "text" as const, text: `Invalid scene number` }] }
      }

      ast.scenes.splice(idx, 1)

      const fountain = astToFountain(ast)
      await mkdir(dirname(args.output_path), { recursive: true })
      await writeFile(args.output_path, fountain, "utf-8")

      return {
        content: [
          {
            type: "text" as const,
            text: `Scene ${args.scene_number} removed. Total: ${ast.scenes.length}. Saved to ${args.output_path}`,
          },
        ],
      }
    }
  )

  server.registerTool(
    "character_report",
    {
      title: "Character report",
      description: "Get detailed stats for all characters in a stored screenplay.",
      inputSchema: z.object(
    {
      screenplay_id: z.string().describe("The screenplay name/ID"),
    }),
      annotations: READ_ONLY,
    },
    async (args: { screenplay_id: string }) => {
      const ast = store.get(args.screenplay_id)
      if (!ast) return { content: [{ type: "text" as const, text: `Screenplay not found` }] }

      const lines = ["# Character Report\n"]
      const sorted = Array.from(ast.characters.values()).sort((a, b) => b.wordCount - a.wordCount)

      for (const char of sorted) {
        lines.push(`## ${char.name}`)
        lines.push(`- Scenes: ${char.sceneCount} (${char.scenes.join(", ")})`)
        lines.push(`- Dialogue blocks: ${char.dialogueCount}`)
        lines.push(`- Total words: ${char.wordCount}`)
        lines.push(`- First appearance: Scene ${char.firstAppearance}`)
        lines.push("")
      }

      return { content: [{ type: "text" as const, text: lines.join("\n") }] }
    }
  )

  server.registerTool(
    "scene_breakdown",
    {
      title: "Scene breakdown",
      description: "Get a production breakdown of all scenes: characters, action/dialogue lines, estimated pages.",
      inputSchema: z.object(
    {
      screenplay_id: z.string().describe("The screenplay name/ID"),
    }),
      annotations: READ_ONLY,
    },
    async (args: { screenplay_id: string }) => {
      const ast = store.get(args.screenplay_id)
      if (!ast) return { content: [{ type: "text" as const, text: `Screenplay not found` }] }

      const breakdown = getSceneBreakdown(ast)
      const lines = ["# Scene Breakdown\n"]
      let totalPages = 0

      for (const b of breakdown) {
        totalPages += b.estimatedPages
        lines.push(`## Scene ${b.sceneNumber}: ${b.heading}`)
        lines.push(`- Location: ${b.locationType}. ${b.location} - ${b.timeOfDay}`)
        lines.push(`- Characters: ${b.characters.join(", ") || "(none)"}`)
        lines.push(`- Action lines: ${b.actionLines} | Dialogue lines: ${b.dialogueLines}`)
        lines.push(`- Est. pages: ${b.estimatedPages} (~${b.estimatedSeconds}s)`)
        lines.push("")
      }

      lines.push(`**Total estimated pages: ${Math.round(totalPages * 10) / 10}**`)

      return { content: [{ type: "text" as const, text: lines.join("\n") }] }
    }
  )

  server.registerTool(
    "runtime_estimate",
    {
      title: "Runtime estimate",
      description: "Estimate the runtime of a stored screenplay based on page count (1 page ≈ 1 minute).",
      inputSchema: z.object(
    {
      screenplay_id: z.string().describe("The screenplay name/ID"),
    }),
      annotations: READ_ONLY,
    },
    async (args: { screenplay_id: string }) => {
      const ast = store.get(args.screenplay_id)
      if (!ast) return { content: [{ type: "text" as const, text: `Screenplay not found` }] }

      const runtime = estimateRuntime(ast)
      const dayNight = { day: 0, night: 0 }
      const intExt = { int: 0, ext: 0 }

      for (const scene of ast.scenes) {
        const tod = scene.timeOfDay.toLowerCase()
        if (tod.includes("day")) dayNight.day++
        else if (tod.includes("night")) dayNight.night++

        if (scene.locationType.startsWith("INT")) intExt.int++
        else intExt.ext++
      }

      const text = [
        `# Runtime Estimate`,
        `**Pages:** ${runtime.pages}`,
        `**Minutes:** ~${runtime.minutes}`,
        `**Scenes:** ${runtime.scenes}`,
        "",
        `**Day/Night split:** ${dayNight.day} day / ${dayNight.night} night`,
        `**INT/EXT split:** ${intExt.int} interior / ${intExt.ext} exterior`,
      ].join("\n")

      return { content: [{ type: "text" as const, text }] }
    }
  )

  server.registerTool(
    "export_fountain",
    {
      title: "Export fountain",
      description: "Export a stored screenplay back to Fountain format and save to disk.",
      inputSchema: z.object(
    {
      screenplay_id: z.string().describe("The screenplay name/ID"),
      output_path: z.string().describe("Where to save the .fountain file"),
    }),
      annotations: WRITE,
    },
    async (args: { screenplay_id: string; output_path: string }) => {
      const ast = store.get(args.screenplay_id)
      if (!ast) return { content: [{ type: "text" as const, text: `Screenplay not found` }] }

      const fountain = astToFountain(ast)
      await mkdir(dirname(args.output_path), { recursive: true })
      await writeFile(args.output_path, fountain, "utf-8")

      return { content: [{ type: "text" as const, text: `Exported to ${args.output_path}` }] }
    }
  )

  server.registerTool(
    "list_screenplays",
    {
      title: "List screenplays",
      description: "List all currently loaded screenplays in memory.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (_args: {}) => {
    const ids = Array.from(store.keys())
    if (ids.length === 0) return { content: [{ type: "text" as const, text: "No screenplays loaded" }] }

    const lines = ids.map((id) => {
      const ast = store.get(id)!
      return `- **${id}**: ${ast.scenes.length} scenes, ${ast.characters.size} characters`
    })

    return { content: [{ type: "text" as const, text: `# Loaded Screenplays\n\n${lines.join("\n")}` }] }
  }
  )

  server.registerTool(
    "source_material_reference",
    {
      title: "Source material reference",
      description: "Look up a novel or other source material on Open Library and get what you need before adapting it: author, first publication date, description, subject index (people, places, periods), and whether a full-text scan is catalogued.",
      inputSchema: z.object( { title: z.string().min(1).describe("Work title, e.g. 'The Stranger'."), author: z.string().optional().describe("Author surname, to disambiguate, e.g. 'Camus'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: source_material_reference ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_screenplaywriter_source_material_reference", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
