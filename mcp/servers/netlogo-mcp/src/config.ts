import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "netlogo",
  "displayName": "NetLogo",
  "version": "1.0.0",
  "extensions": [
    ".nlogo"
  ],
  "markers": [],
  "comment": ";",
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
      "path": "src/demo.nlogo",
      "content": "to setup\n  clear-all\nend\n"
    },
    {
      "path": "tests/run.nlogo",
      "content": "to setup\n  clear-all\nend\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "to setup\n  clear-all\nend\n"
    }
  },
  "reference": "NetLogo syntax reference\n- Example: to setup\n- Comment: ;\n- No CLI runner configured"
}
