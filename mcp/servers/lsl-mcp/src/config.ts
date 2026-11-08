import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lsl",
  "displayName": "LSL",
  "version": "1.0.0",
  "extensions": [
    ".lsl",
    ".lslp"
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
      "path": "src/demo.lsl",
      "content": "default { state_entry() { llSay(0, \"Hi\"); } }\n"
    },
    {
      "path": "tests/run.lsl",
      "content": "default { state_entry() { llSay(0, \"Hi\"); } }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "default { state_entry() { llSay(0, \"Hi\"); } }\n"
    }
  },
  "reference": "LSL syntax reference\n- Example: default { state_entry() { llSay(0, \"Hi\"); } }\n- Comment: //\n- No CLI runner configured"
}
