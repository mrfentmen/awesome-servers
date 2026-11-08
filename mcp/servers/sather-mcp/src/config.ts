import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sather",
  "displayName": "Sather",
  "version": "1.0.0",
  "extensions": [
    ".sa"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.sa",
      "content": "class DEMO is\n  add(a, b: INT): INT is return a + b; end;\nend;\n"
    },
    {
      "path": "tests/run.sa",
      "content": "class DEMO is\n  add(a, b: INT): INT is return a + b; end;\nend;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class DEMO is\n  add(a, b: INT): INT is return a + b; end;\nend;\n"
    }
  },
  "reference": "Sather syntax reference\n- Example: class DEMO is"
}
