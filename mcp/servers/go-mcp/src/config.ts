import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "go",
  "displayName": "Go",
  "version": "1.0.0",
  "extensions": [
    ".go"
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
      "path": "src/demo.go",
      "content": "package main\nfunc main() {}\n"
    },
    {
      "path": "tests/run.go",
      "content": "package main\nfunc main() {}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "package main\nfunc main() {}\n"
    }
  },
  "reference": "Go syntax reference\n- Example: package main\n- Comment: //\n- No CLI runner configured"
}
