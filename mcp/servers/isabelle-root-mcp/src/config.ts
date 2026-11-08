import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "isabelle-root",
  "displayName": "Isabelle ROOT",
  "version": "1.0.0",
  "extensions": [
    ".txt"
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
      "path": "src/demo.txt",
      "content": "session Demo = HOL +\n"
    },
    {
      "path": "tests/run.txt",
      "content": "session Demo = HOL +\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "session Demo = HOL +\n"
    }
  },
  "reference": "Isabelle ROOT syntax reference\n- Example: session Demo = HOL +\n- Comment: ;\n- No CLI runner configured"
}
