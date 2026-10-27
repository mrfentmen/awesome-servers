import type {
  ActionNode,
  CharacterNode,
  DialogueNode,
  ParentheticalNode,
  SceneBreakdown,
  SceneNode,
  ScreenplayAST,
  ScreenplayNode,
  TransitionNode,
} from "./types.js"

const SCENE_HEADING_PATTERN = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s+(.+?)(?:\s*-\s*(.+?))?$/i
const TRANSITION_PATTERN =
  /^(CUT TO|FADE IN\.?|FADE OUT\.?|FADE\.?\s*(IN|OUT)|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO|CUT TO BLACK|FADE TO BLACK)\s*:?\s*$/i
const CHARACTER_PATTERN = /^([A-Z][A-Z0-9.'_\-\s]*?)(\s*\(.*?\))?\s*$/
const PARENTHETICAL_PATTERN = /^\(.*?\)$/
const SECTION_PATTERN = /^(#{1,6})\s+(.+)$/
const NOTE_PATTERN = /^\[\[(.+?)\]\]$/
const SYNOSPESIS_PATTERN = /^=(?!\=)\s+(.+)$/
const PAGE_BREAK_PATTERN = /^\={3,}$/
const TITLE_PATTERN = /^Title:\s*(.+)$/i
const CREDIT_PATTERN = /^Credit:\s*(.+)$/i
const AUTHOR_PATTERN = /^Author:\s*(.+)$/i
const AUTHORS_PATTERN = /^Authors:\s*(.+)$/i
const DRAFT_DATE_PATTERN = /^Draft date:\s*(.+)$/i
const CONTACT_PATTERN = /^Contact:\s*(.+)$/i
const COPYRIGHT_PATTERN = /^Copyright:\s*(.+)$/i
const FORMAT_PATTERN = /^Format:\s*(.+)$/i
const SCENE_NUMBER_PATTERN = /^(#\d+#)$/

export function parseFountain(text: string): ScreenplayAST {
  const lines = text.split(/\r?\n/)
  const scenes: SceneNode[] = []
  const allNodes: ScreenplayNode[] = []
  const characters = new Map<string, { count: number; scenes: Set<number>; words: number }>()

  let currentScene: SceneNode | null = null
  let currentCharacter = ""
  let lineNumber = 0
  let sceneIndex = 0
  let pendingDialogue = false
  let title: string | undefined
  const credits: { key: string; value: string }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    lineNumber++

    if (!trimmed) {
      pendingDialogue = false
      continue
    }

    if (trimmed.match(TITLE_PATTERN)) {
      title = trimmed.match(TITLE_PATTERN)![1]
      continue
    }

    const creditMatch = trimmed.match(CREDIT_PATTERN)
    if (creditMatch) {
      credits.push({ key: "Credit", value: creditMatch[1] })
      continue
    }

    const authorMatch = trimmed.match(AUTHOR_PATTERN)
    if (authorMatch) {
      credits.push({ key: "Author", value: authorMatch[1] })
      continue
    }

    const authorsMatch = trimmed.match(AUTHORS_PATTERN)
    if (authorsMatch) {
      credits.push({ key: "Authors", value: authorsMatch[1] })
      continue
    }

    const draftMatch = trimmed.match(DRAFT_DATE_PATTERN)
    if (draftMatch) {
      credits.push({ key: "Draft date", value: draftMatch[1] })
      continue
    }

    const contactMatch = trimmed.match(CONTACT_PATTERN)
    if (contactMatch) {
      credits.push({ key: "Contact", value: contactMatch[1] })
      continue
    }

    const copyrightMatch = trimmed.match(COPYRIGHT_PATTERN)
    if (copyrightMatch) {
      credits.push({ key: "Copyright", value: copyrightMatch[1] })
      continue
    }

    const formatMatch = trimmed.match(FORMAT_PATTERN)
    if (formatMatch) {
      credits.push({ key: "Format", value: formatMatch[1] })
      continue
    }

    const pageBreakMatch = trimmed.match(PAGE_BREAK_PATTERN)
    if (pageBreakMatch) {
      const node: ScreenplayNode = { type: "page_break", text: "" }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)
      continue
    }

    const sectionMatch = trimmed.match(SECTION_PATTERN)
    if (sectionMatch) {
      const node: ScreenplayNode = { type: "section", text: sectionMatch[2], depth: sectionMatch[1].length }
      allNodes.push(node)
      continue
    }

    const noteMatch = trimmed.match(NOTE_PATTERN)
    if (noteMatch) {
      const node: ScreenplayNode = { type: "note", text: noteMatch[1] }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)
      continue
    }

    const synopsisMatch = trimmed.match(SYNOSPESIS_PATTERN)
    if (synopsisMatch) {
      const node: ScreenplayNode = { type: "synopsis", text: synopsisMatch[1] }
      allNodes.push(node)
      continue
    }

    const sceneMatch = trimmed.match(SCENE_HEADING_PATTERN)
    if (sceneMatch && !pendingDialogue) {
      sceneIndex++
      const locationType = sceneMatch[1].replace(/\.$/, "").toUpperCase() as SceneNode["locationType"]
      const location = sceneMatch[2].trim()
      const timeOfDay = sceneMatch[3]?.trim() || ""

      currentScene = {
        type: "scene_heading",
        text: trimmed,
        location,
        locationType,
        timeOfDay,
        nodes: [],
        sceneNumber: String(sceneIndex),
      }
      scenes.push(currentScene)
      allNodes.push(currentScene)
      pendingDialogue = false
      continue
    }

    const transitionMatch = trimmed.match(TRANSITION_PATTERN)
    if (transitionMatch && !pendingDialogue) {
      const node: TransitionNode = { type: "transition", text: trimmed.toUpperCase() }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)
      pendingDialogue = false
      continue
    }

    const charMatch = trimmed.match(CHARACTER_PATTERN)
    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
    const hasParenthetical = trimmed.includes("(") && trimmed.includes(")")

    if (isAllCaps && !hasParenthetical && charMatch && trimmed.length > 1 && !trimmed.match(/^[A-Z]$/)) {
      const name = charMatch[1].trim().replace(/\s*\(.*?\)\s*$/, "")
      const extension = charMatch[2]?.trim()

      if (!name.match(/^(INT|EXT|FADE|CUT|DISSOLVE|EST|TITLE|CREDIT|AUTHOR|DRAFT|CONTACT|COPYRIGHT|FORMAT|OUT|IN)$/i)) {
        const node: CharacterNode = { type: "character", text: trimmed, name, extension }
        allNodes.push(node)
        if (currentScene) currentScene.nodes.push(node)
        currentCharacter = name
        pendingDialogue = true

        if (!characters.has(name)) {
          characters.set(name, { count: 0, scenes: new Set(), words: 0 })
        }
        const stats = characters.get(name)!
        stats.count++
        stats.scenes.add(sceneIndex)
        continue
      }
    }

    if (pendingDialogue && trimmed.match(PARENTHETICAL_PATTERN)) {
      const node: ParentheticalNode = { type: "parenthetical", text: trimmed }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)
      continue
    }

    if (pendingDialogue && currentCharacter) {
      const node: DialogueNode = { type: "dialogue", text: trimmed, character: currentCharacter }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)

      const stats = characters.get(currentCharacter)
      if (stats) {
        stats.words += trimmed.split(/\s+/).filter(Boolean).length
      }
      pendingDialogue = false
      continue
    }

    const node: ActionNode = { type: "action", text: trimmed }
    allNodes.push(node)
    if (currentScene) currentScene.nodes.push(node)
    pendingDialogue = false
  }

  return {
    title,
    credits,
    scenes,
    allNodes,
    characters: new Map(
      Array.from(characters.entries()).map(([name, stats]) => [
        name,
        {
          name,
          sceneCount: stats.scenes.size,
          dialogueCount: stats.count,
          wordCount: stats.words,
          firstAppearance: Math.min(...stats.scenes),
          lastAppearance: Math.max(...stats.scenes),
          scenes: Array.from(stats.scenes).sort((a, b) => a - b),
        },
      ]),
    ),
  }
}

export function astToFountain(ast: ScreenplayAST): string {
  const lines: string[] = []

  if (ast.title) {
    lines.push(`Title: ${ast.title}`)
    lines.push("")
  }

  for (const credit of ast.credits) {
    lines.push(`${credit.key}: ${credit.value}`)
  }
  if (ast.credits.length > 0) lines.push("")

  for (const scene of ast.scenes) {
    lines.push(scene.text)

    for (const node of scene.nodes) {
      switch (node.type) {
        case "action":
          lines.push(node.text)
          break
        case "character":
          lines.push(node.text)
          break
        case "dialogue":
          lines.push(node.text)
          break
        case "parenthetical":
          lines.push(node.text)
          break
        case "transition":
          lines.push(node.text)
          break
        case "note":
          lines.push(`[[${node.text}]]`)
          break
        case "page_break":
          lines.push("===")
          break
      }
    }

    lines.push("")
  }

  return lines.join("\n").trim() + "\n"
}

export function sceneToFountain(scene: SceneNode): string {
  const lines: string[] = [scene.text]
  for (const node of scene.nodes) {
    switch (node.type) {
      case "action":
      case "character":
      case "dialogue":
      case "parenthetical":
      case "transition":
        lines.push(node.text)
        break
      case "note":
        lines.push(`[[${node.text}]]`)
        break
    }
  }
  return lines.join("\n")
}

export function getSceneBreakdown(ast: ScreenplayAST): SceneBreakdown[] {
  return ast.scenes.map((scene, idx) => {
    const chars = new Set<string>()
    let actionLines = 0
    let dialogueLines = 0

    for (const node of scene.nodes) {
      if (node.type === "character") {
        chars.add((node as CharacterNode).name)
      } else if (node.type === "dialogue") {
        dialogueLines++
      } else if (node.type === "action") {
        actionLines++
      }
    }

    const estimatedPages = (actionLines * 1 + dialogueLines * 0.8) / 55
    const estimatedSeconds = estimatedPages * 60

    return {
      sceneNumber: idx + 1,
      heading: scene.text,
      location: scene.location,
      locationType: scene.locationType,
      timeOfDay: scene.timeOfDay,
      characters: Array.from(chars),
      actionLines,
      dialogueLines,
      estimatedPages: Math.round(estimatedPages * 10) / 10,
      estimatedSeconds: Math.round(estimatedSeconds),
    }
  })
}

export function estimateRuntime(ast: ScreenplayAST): { pages: number; minutes: number; scenes: number } {
  const totalLines = ast.allNodes.filter((n) => n.type === "action" || n.type === "dialogue").length
  const pages = Math.round((totalLines / 55) * 10) / 10
  const minutes = Math.round(pages)
  return { pages, minutes, scenes: ast.scenes.length }
}
