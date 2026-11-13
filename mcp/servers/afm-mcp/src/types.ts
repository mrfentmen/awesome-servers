export type Severity = "error" | "warning"

export interface Issue {
  code: string
  severity: Severity
  message: string
  line?: number
}

export interface ParsedRecord {
  id: string
  kind: string
  fields: Record<string, string | number | boolean | null>
}

export interface Parsed {
  format: string
  records: ParsedRecord[]
  meta: Record<string, string | number | boolean | null>
  issues: Issue[]
}

export interface FormatModule {
  slug: string
  displayName: string
  extensions: string[]
  description: string
  reference: string
  parse(text: string): Parsed
  sample(): string
  regressions?: Array<{ doc: string; expectError: string }>
}
