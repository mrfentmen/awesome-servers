import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pvs",
  "displayName": "PVS",
  "version": "1.0.0",
  "extensions": [
    ".pvs"
  ],
  "markers": [],
  "comment": "%",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "theory",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:\\s*THEORY"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.pvs",
      "content": "Demo: THEORY\nBEGIN\n  add(a, b: int): int = a + b\nEND Demo\n"
    },
    {
      "path": "tests/run.pvs",
      "content": "Demo: THEORY\nBEGIN\n  add(a, b: int): int = a + b\nEND Demo\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Demo: THEORY\nBEGIN\n  add(a, b: int): int = a + b\nEND Demo\n"
    }
  },
  "reference": "PVS syntax reference\n- Example: Demo: THEORY"
}
