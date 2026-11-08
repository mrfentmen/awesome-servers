import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gap",
  "displayName": "GAP",
  "version": "1.0.0",
  "extensions": [
    ".g",
    ".gap",
    ".gd",
    ".gi"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^([A-Za-z_]\\w*)\\s*:="
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.g",
      "content": "add := function(a, b)\n  return a + b;\nend;\n"
    },
    {
      "path": "tests/run.g",
      "content": "add := function(a, b)\n  return a + b;\nend;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "add := function(a, b)\n  return a + b;\nend;\n"
    }
  },
  "reference": "GAP syntax reference\n- Example: add := function(a, b)\n- Comment: #\n- Run: gap -q {file}"
}
