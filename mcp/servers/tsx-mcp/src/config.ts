import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "tsx",
  "displayName": "TSX",
  "version": "1.0.0",
  "extensions": [
    ".tsx"
  ],
  "markers": [],
  "comment": "//",
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
      "path": "src/demo.tsx",
      "content": "export const Demo = () => <div />\n"
    },
    {
      "path": "tests/run.tsx",
      "content": "export const Demo = () => <div />\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "export const Demo = () => <div />\n"
    }
  },
  "reference": "TSX syntax reference\n- Example: export const Demo = () => <div />\n- Comment: //\n- No CLI runner configured"
}
