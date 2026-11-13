export interface CommandSpec {
  command: string
  args: string[]
  timeoutMs?: number
}

export interface SymbolRule {
  kind: string
  pattern: string
  flags?: string
}

export interface ImportRule {
  kind: string
  pattern: string
  flags?: string
}

export interface Snippet {
  description: string
  body: string
}

export interface ScaffoldFile {
  path: string
  content: string
}

export interface LanguageConfig {
  slug: string
  displayName: string
  version: string
  extensions: string[]
  markers: string[]
  comment: string
  blockComment?: { start: string; end: string }
  stringQuotes?: string[]
  allowTabs?: boolean
  buildDir?: string
  symbols: SymbolRule[]
  imports: ImportRule[]
  runner?: CommandSpec[]
  syntax?: CommandSpec
  build?: CommandSpec[]
  test?: CommandSpec[]
  scaffold: ScaffoldFile[]
  snippets: Record<string, Snippet>
  reference: string
}
