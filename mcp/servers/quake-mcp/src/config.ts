import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "quake",
  "displayName": "Quake",
  "version": "1.0.0",
  "extensions": [
    ".txt"
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
      "path": "src/demo.txt",
      "content": "\"classname\" \"worldspawn\"\n"
    },
    {
      "path": "tests/run.txt",
      "content": "\"classname\" \"worldspawn\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "\"classname\" \"worldspawn\"\n"
    }
  },
  "reference": "Quake syntax reference\n- Example: \"classname\" \"worldspawn\"\n- Comment: //\n- No CLI runner configured"
}
