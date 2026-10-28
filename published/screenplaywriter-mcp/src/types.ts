export type ElementType =
  | "scene_heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "section"
  | "synopsis"
  | "note"
  | "page_break"
  | "title"
  | "credit"
  | "author"
  | "authors"
  | "draft_date"
  | "contact"
  | "copyright"
  | "format"
  | "scene_number"

export interface ScreenplayNode {
  type: ElementType
  text: string
  sceneNumber?: string
  depth?: number
  children?: ScreenplayNode[]
}

export interface SceneNode extends ScreenplayNode {
  type: "scene_heading"
  location: string
  locationType: "INT" | "EXT" | "INT/EXT" | "I/E"
  timeOfDay: string
  nodes: ScreenplayNode[]
}

export interface CharacterNode extends ScreenplayNode {
  type: "character"
  name: string
  extension?: string
}

export interface DialogueNode extends ScreenplayNode {
  type: "dialogue"
  character: string
}

export interface ActionNode extends ScreenplayNode {
  type: "action"
}

export interface ParentheticalNode extends ScreenplayNode {
  type: "parenthetical"
}

export interface TransitionNode extends ScreenplayNode {
  type: "transition"
}

export interface ScreenplayAST {
  title?: string
  credits: { key: string; value: string }[]
  scenes: SceneNode[]
  allNodes: ScreenplayNode[]
  characters: Map<string, CharacterStats>
}

export interface CharacterStats {
  name: string
  sceneCount: number
  dialogueCount: number
  wordCount: number
  firstAppearance: number
  lastAppearance: number
  scenes: number[]
}

export interface SceneBreakdown {
  sceneNumber: number
  heading: string
  location: string
  locationType: "INT" | "EXT" | "INT/EXT" | "I/E"
  timeOfDay: string
  characters: string[]
  actionLines: number
  dialogueLines: number
  estimatedPages: number
  estimatedSeconds: number
}
