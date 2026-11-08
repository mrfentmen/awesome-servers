import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "liquidsoap",
  "displayName": "Liquidsoap",
  "version": "1.0.0",
  "extensions": [
    ".liq"
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
      "path": "src/demo.liq",
      "content": "radio = sine(440.0)\n"
    },
    {
      "path": "tests/run.liq",
      "content": "radio = sine(440.0)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "radio = sine(440.0)\n"
    }
  },
  "reference": "Liquidsoap syntax reference\n- Example: radio = sine(440.0)\n- Comment: #\n- No CLI runner configured"
}
