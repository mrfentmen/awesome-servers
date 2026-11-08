import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jac",
  "displayName": "Jac",
  "version": "1.0.0",
  "extensions": [
    ".jac"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.jac",
      "content": "def add(a: int, b: int) -> int {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.jac",
      "content": "def add(a: int, b: int) -> int {\n  return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a: int, b: int) -> int {\n  return a + b;\n}\n"
    }
  },
  "reference": "Jac syntax reference\n- Example: def add(a: int, b: int) -> int {\n- Comment: #\n- Run: jac {file}"
}
