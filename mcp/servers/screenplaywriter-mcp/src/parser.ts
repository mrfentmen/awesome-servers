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

const SCENE_HEADING_PATTERN = /^(INT\.?|EXT\.?|INT\.?\/EXT\.?|I\/E\.?|EST\.?)\s+(.+?)(?:\s*-\s*(.+?))?$/i
const TRANSITION_PATTERN =
  /^(CUT TO|FADE IN\.?|FADE OUT\.?|FADE\.?\s*(IN|OUT)|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO|CUT TO BLACK|FADE TO BLACK|IRIS\s+(IN|OUT)|FADE TO\s+BLACK)\s*[:.]?\s*$/i
// Any all-caps line ending in ":" is a transition on the ScriptWriter site
// (custom transitions like "SMASH TO BLACK:"). Checked before character cues.
const CUSTOM_TRANSITION_PATTERN = /^[A-Z0-9][A-Z0-9 .'\-]*:$/u
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
// ScriptWriter exports the logline on the title page as "Notes: ...".
const NOTES_PATTERN = /^Notes:\s*(.+)$/i
const SCENE_NUMBER_PATTERN = /^(#\d+#)$/
// Structural insert elements from the ScriptWriter site (Insert bar). These
// are uppercase by convention but are NOT character cues: MONTAGE, ACT ONE,
// COLD OPEN, TITLE CARD, CURTAIN, etc. They parse as action.
const SITE_STRUCTURE_PATTERN =
  /^(MONTAGE|INTERCUT|SUPER|FREEZE FRAME|FLASHBACK|PRE-?LAP|TIME CUT|MATCH CUT|SERIES OF SHOTS|SMASH BLACK|COLD OPEN|TITLE CARD|END CARD|TAG|TEASER|BUTTON|CURTAIN|ACT\s+(ONE|TWO|THREE|FOUR|FIVE|I{1,3}V?|V|\d+)|SCENE\s+\d+|SEQUENCE|NEW ACT|END ACT|CAST LIST|GENERAL|BOOKMARK|LABEL|LYRICS|SUMMARY|CENTERED|SECTION|SYNOPSIS|NOTE)\b/i
// Single-word structural cues that must never become character names.
const NON_CHARACTER_WORDS =
  /^(MONTAGE|INTERCUT|SUPER|TAG|TEASER|BUTTON|CURTAIN|ACT|SCENE|SEQUENCE|SHOT|CUT|FADE|DISSOLVE|IRIS|SMASH|MATCH|OPEN|COLD|CARD|TITLE|CREDIT|AUTHOR|DRAFT|CONTACT|COPYRIGHT|FORMAT|NOTES|OUT|IN|EST|INT|EXT)$/i

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
    let trimmed = line.trim()
    lineNumber++

    if (!trimmed) {
      pendingDialogue = false
      continue
    }

    // Fountain force markers (same as the ScriptWriter site): a leading
    // '.', '!', '@' or '>' pins the element type. The marker is stripped so
    // exports and the site show clean text.
    let forced: "heading" | "action" | "character" | "transition" | null = null
    const first = trimmed.charAt(0)
    if (first === "@" && trimmed.length > 1) {
      forced = "character"
      trimmed = trimmed.slice(1).trim()
    } else if (first === "!") {
      forced = "action"
      trimmed = trimmed.slice(1).trim()
    } else if (first === ".") {
      forced = "heading"
      trimmed = trimmed.slice(1).trim()
    } else if (first === ">") {
      if (trimmed.charAt(trimmed.length - 1) === "<") {
        forced = "action" // centered text counts as action on the site
        trimmed = trimmed.slice(1, -1).trim()
      } else {
        forced = "transition"
        trimmed = trimmed.slice(1).trim()
      }
    }
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

    const notesMatch = trimmed.match(NOTES_PATTERN)
    if (notesMatch) {
      credits.push({ key: "Notes", value: notesMatch[1] })
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
    if ((sceneMatch && !pendingDialogue) || forced === "heading") {
      sceneIndex++
      const hm = sceneMatch || [trimmed, "INT", trimmed, ""]
      const locationType = String(hm[1]).replace(/\.$/, "").toUpperCase() as SceneNode["locationType"]
      const location = String(hm[2]).trim()
      const timeOfDay = String(hm[3] || "").trim()

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
    if ((transitionMatch && !pendingDialogue) || forced === "transition") {
      const node: TransitionNode = { type: "transition", text: trimmed.toUpperCase() }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)
      pendingDialogue = false
      continue
    }

    // Custom all-caps transitions ("SMASH TO BLACK:") and the site's
    // structural inserts (MONTAGE, ACT ONE, COLD OPEN, ...) are action,
    // never character cues — same as the ScriptWriter site.
    if (!pendingDialogue && !forced && trimmed.match(CUSTOM_TRANSITION_PATTERN)) {
      const node: TransitionNode = { type: "transition", text: trimmed.toUpperCase() }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)
      pendingDialogue = false
      continue
    }
    if (!pendingDialogue && !forced && trimmed.match(SITE_STRUCTURE_PATTERN)) {
      const node: ActionNode = { type: "action", text: trimmed }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)
      pendingDialogue = false
      continue
    }
    if (forced === "action") {
      const node: ActionNode = { type: "action", text: trimmed }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)
      pendingDialogue = false
      continue
    }

    const charMatch = trimmed.match(CHARACTER_PATTERN)
    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
    const hasParenthetical = trimmed.includes("(") && trimmed.includes(")")

    // A new cue always interrupts dialogue and starts a new speech.
    if (
      forced === "character" ||
      (isAllCaps &&
        !hasParenthetical &&
        charMatch &&
        trimmed.length > 1 &&
        !trimmed.match(/^[A-Z]$/) &&
        !trimmed.match(SITE_STRUCTURE_PATTERN) &&
        !trimmed.match(CUSTOM_TRANSITION_PATTERN))
    ) {
      const name = (charMatch?.[1] || trimmed).trim().replace(/\s*\(.*?\)\s*$/, "")
      const extension = charMatch?.[2]?.trim()

      if (!name.match(NON_CHARACTER_WORDS)) {
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

    // Parentheticals stand alone (the site classifies any (...) line as one).
    if (trimmed.match(PARENTHETICAL_PATTERN)) {
      const node: ParentheticalNode = { type: "parenthetical", text: trimmed }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)
      continue
    }

    // Dialogue runs until a blank line: every plain line after a cue belongs
    // to the speech, same as the ScriptWriter site.
    if (pendingDialogue && currentCharacter) {
      const node: DialogueNode = { type: "dialogue", text: trimmed, character: currentCharacter }
      allNodes.push(node)
      if (currentScene) currentScene.nodes.push(node)

      const stats = characters.get(currentCharacter)
      if (stats) {
        stats.words += trimmed.split(/\s+/).filter(Boolean).length
      }
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

export interface TitleMeta {
  title?: string
  logline?: string
  byline?: string
  draftDate?: string
  contact?: string
  copyright?: string
}

// buildTitleBlock emits the exact title-page block the ScriptWriter site
// reads on import: Title, Credit, Author, Draft date, Copyright, Contact,
// then Notes carrying the logline, then a blank line before the body.
export function buildTitleBlock(meta: TitleMeta): string {
  const lines: string[] = []
  const title = (meta.title || "").trim()
  const logline = (meta.logline || "").trim()
  const byline = (meta.byline || "").trim()
  const draftDate = (meta.draftDate || "").trim()
  const contact = (meta.contact || "").trim()
  const copyright = (meta.copyright || "").trim()
  if (!title && !byline && !draftDate && !copyright && !contact && !logline) return ""
  if (title) lines.push(`Title: ${title}`)
  lines.push("Credit: written by")
  if (byline) lines.push(`Author: ${byline}`)
  if (draftDate) lines.push(`Draft date: ${draftDate}`)
  if (copyright) lines.push(`Copyright: ${copyright}`)
  if (contact) lines.push(`Contact: ${contact}`)
  if (logline) lines.push(`Notes: ${logline}`)
  lines.push("")
  return lines.join("\n")
}

// titleMetaFromCredits reads a parsed credit list back into title fields.
// The site (and this server's own writer) put the premise in Credit, while
// full-spec exports carry it in Notes — Notes wins when both exist, and a
// literal "written by" Credit is a label, not a logline.
export function titleMetaFromCredits(
  title: string | undefined,
  credits: { key: string; value: string }[]
): TitleMeta {
  const meta: TitleMeta = { title }
  for (const c of credits) {
    const key = c.key.toLowerCase()
    if (key === "notes" && c.value.trim()) meta.logline = c.value.trim()
    else if (key === "author" || key === "authors") meta.byline = c.value.trim()
    else if (key === "draft date") meta.draftDate = c.value.trim()
    else if (key === "contact") meta.contact = c.value.trim()
    else if (key === "copyright") meta.copyright = c.value.trim()
    else if (key === "credit" && !/^written by$/i.test(c.value.trim())) meta.logline = meta.logline || c.value.trim()
  }
  return meta
}

// astToBody renders scenes only — no title block. This is the `content`
// field of a ScriptWriter site script, whose title/logline live in fields.
export function astToBody(ast: ScreenplayAST): string {
  const lines: string[] = []

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

export function astToFountain(ast: ScreenplayAST): string {
  const head = buildTitleBlock(titleMetaFromCredits(ast.title, ast.credits))
  return (head ? head + "\n" : "") + astToBody(ast)
}

export interface SiteScript {
  id: string
  title: string
  logline: string
  byline: string
  contact: string
  draftDate: string
  copyright: string
  format: string
  content: string
  createdAt: number
  updatedAt: number
  deletedAt: null
}

// astToSiteScript converts a stored screenplay into one ScriptWriter site
// script object: metadata in fields, scenes-only Fountain in `content`.
// The site's Restore accepts any entry with a string `content` and fills
// the rest with defaults, so this is intentionally complete but minimal.
export function astToSiteScript(ast: ScreenplayAST, overrides?: Partial<SiteScript> & { id?: string }): SiteScript {
  const meta = titleMetaFromCredits(ast.title, ast.credits)
  const now = Date.now()
  return {
    id: overrides?.id || `mcp-${now.toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`,
    title: overrides?.title ?? meta.title ?? "Untitled Script",
    logline: overrides?.logline ?? meta.logline ?? "",
    byline: overrides?.byline ?? meta.byline ?? "",
    contact: overrides?.contact ?? meta.contact ?? "",
    draftDate: overrides?.draftDate ?? meta.draftDate ?? "",
    copyright: overrides?.copyright ?? meta.copyright ?? "",
    format: overrides?.format ?? "screenplay",
    content: astToBody(ast),
    createdAt: overrides?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  }
}

// siteBackupJson wraps scripts in the envelope the site's Restore button
// accepts: { app: "ScriptWriter", scripts: [...] }. Entries with duplicate
// ids are skipped by the site — nothing is ever overwritten.
export function siteBackupJson(scripts: SiteScript[]): string {
  return JSON.stringify({ app: "ScriptWriter", scripts, exportedAt: new Date().toISOString() }, null, 2) + "\n"
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
