import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "postscript",
  "displayName": "PostScript",
  "version": "1.0.0",
  "extensions": [
    ".ps"
  ],
  "markers": [],
  "comment": "%",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*/([A-Za-z_][A-Za-z0-9_-]*)\\s*\\{"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*/([A-Za-z_][A-Za-z0-9_-]*)\\s+"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*\\(([^)]+)\\)\\s*run"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ps",
      "content": "/add { add } bind def\n"
    },
    {
      "path": "tests/run.ps",
      "content": "/add { add } bind def\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "/value { 1 add } bind def"
    }
  },
  "reference": "PostScript syntax reference\n- Function: /value { 1 add } bind def\n- Variable: /value 1 def\n- Include: (file.ps) run\n- Stack: 1 2 add\n- Conditional: condition { ... } if\n- Loop: 10 { ... } repeat\n- Comment: % line\n- Run: gs file.ps"
}
