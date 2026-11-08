import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "wing",
  "displayName": "Wing",
  "version": "1.0.0",
  "extensions": [
    ".w"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+([a-z][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.w",
      "content": "let add = (a: num, b: num): num => a + b;\n"
    },
    {
      "path": "tests/run.w",
      "content": "let add = (a: num, b: num): num => a + b;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let add = (a: num, b: num): num => a + b;\n"
    }
  },
  "reference": "Wing syntax reference\n- Example: let add = (a: num, b: num): num => a + b;"
}
