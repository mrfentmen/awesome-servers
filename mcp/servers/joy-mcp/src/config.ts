import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "joy",
  "displayName": "Joy",
  "version": "1.0.0",
  "extensions": [
    ".joy"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*DEFINE\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "word",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_-]*)\\s*=="
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*\"([^\"]+)\"\\s*include"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.joy",
      "content": "DEFINE add == +;\n"
    },
    {
      "path": "tests/run.joy",
      "content": "DEFINE add == +;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "DEFINE value == 1 +;"
    }
  },
  "reference": "Joy syntax reference\n- Definition: DEFINE value == 1 +;\n- Composition: value == 1 +;\n- Include: \"file.joy\" include\n- Stack: 1 2 +\n- Conditional: [then] [else] ifte\n- Loop: [body] while\n- Comment: # line\n- Run: joy file.joy"
}
