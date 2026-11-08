import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "open-policy-agent",
  "displayName": "Open Policy Agent",
  "version": "1.0.0",
  "extensions": [
    ".rego"
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
      "path": "src/demo.rego",
      "content": "package demo\nallow { true }\n"
    },
    {
      "path": "tests/run.rego",
      "content": "package demo\nallow { true }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "package demo\nallow { true }\n"
    }
  },
  "reference": "Open Policy Agent syntax reference\n- Example: package demo\n- Comment: #\n- No CLI runner configured"
}
