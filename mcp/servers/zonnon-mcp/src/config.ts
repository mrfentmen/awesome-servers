import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "zonnon",
  "displayName": "Zonnon",
  "version": "1.0.0",
  "extensions": [
    ".znn"
  ],
  "markers": [],
  "comment": "(*",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.znn",
      "content": "module Demo;\nprocedure Add(a, b: integer): integer;\nbegin\n  return a + b\nend Add;\nend Demo.\n"
    },
    {
      "path": "tests/run.znn",
      "content": "module Demo;\nprocedure Add(a, b: integer): integer;\nbegin\n  return a + b\nend Add;\nend Demo.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module Demo;\nprocedure Add(a, b: integer): integer;\nbegin\n  return a + b\nend Add;\nend Demo.\n"
    }
  },
  "reference": "Zonnon syntax reference\n- Example: module Demo;",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
