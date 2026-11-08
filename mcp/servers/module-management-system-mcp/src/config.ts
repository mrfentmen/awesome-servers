import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "module-management-system",
  "displayName": "Module Management System",
  "version": "1.0.0",
  "extensions": [
    ".mms",
    ".mmk"
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
      "path": "src/demo.mms",
      "content": "DEMO = \"hello\"\n"
    },
    {
      "path": "tests/run.mms",
      "content": "DEMO = \"hello\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "DEMO = \"hello\"\n"
    }
  },
  "reference": "Module Management System syntax reference\n- Example: DEMO = \"hello\"\n- Comment: #\n- No CLI runner configured"
}
