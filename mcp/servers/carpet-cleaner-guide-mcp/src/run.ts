export class ToolError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ToolError"
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] }
}

export function fail(message: string) {
  return { isError: true, content: [{ type: "text" as const, text: message }] }
}
