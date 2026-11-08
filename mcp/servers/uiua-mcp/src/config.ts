import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "uiua",
  "displayName": "Uiua",
  "version": "1.0.0",
  "extensions": [
    ".ua"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*←"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ua",
      "content": "Add ← +\n"
    },
    {
      "path": "tests/run.ua",
      "content": "Add ← +\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Value ← +1"
    }
  },
  "reference": "Uiua syntax reference\n- Function: Value ← +1\n- Bind: Value = 1\n- Stack: 1 2 +\n- Array: [1 2 3]\n- Comment: # line\n- Privacy: ⍥\n- Run: uiua run file.ua"
}
