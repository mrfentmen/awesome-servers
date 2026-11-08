import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "talon",
  "displayName": "Talon",
  "version": "1.0.0",
  "extensions": [
    ".talon"
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
      "path": "src/demo.talon",
      "content": "app.hotkey(\"ctrl-a\")\n"
    },
    {
      "path": "tests/run.talon",
      "content": "app.hotkey(\"ctrl-a\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "app.hotkey(\"ctrl-a\")\n"
    }
  },
  "reference": "Talon syntax reference\n- Example: app.hotkey(\"ctrl-a\")\n- Comment: #\n- No CLI runner configured"
}
