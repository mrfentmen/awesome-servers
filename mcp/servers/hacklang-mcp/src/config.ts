import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "hacklang",
  "displayName": "Hack",
  "version": "1.0.0",
  "extensions": [
    ".hack",
    ".hh",
    ".hhi",
    ".php"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.hack",
      "content": "function add(int $a, int $b): int {\n  return $a + $b;\n}\n"
    },
    {
      "path": "tests/run.hack",
      "content": "function add(int $a, int $b): int {\n  return $a + $b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(int $a, int $b): int {\n  return $a + $b;\n}\n"
    }
  },
  "reference": "Hack syntax reference\n- Example: function add(int $a, int $b): int {",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
