import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "grammatical-framework",
  "displayName": "Grammatical Framework",
  "version": "1.0.0",
  "extensions": [
    ".gf"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "abstract",
      "pattern": "^\\s*abstract\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gf",
      "content": "abstract Demo = {\n  cat Greeting;\n  fun hello : Greeting;\n}\n"
    },
    {
      "path": "tests/run.gf",
      "content": "abstract Demo = {\n  cat Greeting;\n  fun hello : Greeting;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "abstract Demo = {\n  cat Greeting;\n  fun hello : Greeting;\n}\n"
    }
  },
  "reference": "Grammatical Framework syntax reference\n- Example: abstract Demo = {\n- Comment: --\n- Run: gf {file}",
  "blockComment": {
    "start": "{-",
    "end": "-}"
  }
}
