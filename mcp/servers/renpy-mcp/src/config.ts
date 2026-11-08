import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "renpy",
  "displayName": "Ren'Py",
  "version": "1.0.0",
  "extensions": [
    ".rpy"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "\\b(?:function|def|fn|fun|func|proc|procedure|sub|method|class|struct|enum|module|namespace|type|interface|trait|record|object)\\s+([A-Za-z_]\\w*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:[A-Za-z_][\\w<>\\[\\]]*\\s+)+([A-Za-z_]\\w*)\\s*\\("
    },
    {
      "kind": "value",
      "pattern": "^([A-Za-z_]\\w*)\\s*(?::=|=|:)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.rpy",
      "content": "label start:\n  \"Hello\"\n  return\n"
    },
    {
      "path": "tests/run.rpy",
      "content": "label start:\n  \"Hello\"\n  return\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "label start:\n  \"Hello\"\n  return\n"
    }
  },
  "reference": "Ren'Py syntax reference\n- Example: label start:\n- Comment: #\n- No CLI runner configured"
}
