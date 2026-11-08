import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "polar",
  "displayName": "Polar",
  "version": "1.0.0",
  "extensions": [
    ".polar"
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
      "path": "src/demo.polar",
      "content": "allow(user, read, doc) if true;\n"
    },
    {
      "path": "tests/run.polar",
      "content": "allow(user, read, doc) if true;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "allow(user, read, doc) if true;\n"
    }
  },
  "reference": "Polar syntax reference\n- Example: allow(user, read, doc) if true;\n- Comment: #\n- No CLI runner configured"
}
