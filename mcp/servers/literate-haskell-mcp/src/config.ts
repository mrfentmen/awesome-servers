import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "literate-haskell",
  "displayName": "Literate Haskell",
  "version": "1.0.0",
  "extensions": [
    ".lhs"
  ],
  "markers": [],
  "comment": "--",
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
      "path": "src/demo.lhs",
      "content": "> main = putStrLn \"hello\"\n"
    },
    {
      "path": "tests/run.lhs",
      "content": "> main = putStrLn \"hello\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "> main = putStrLn \"hello\"\n"
    }
  },
  "reference": "Literate Haskell syntax reference\n- Example: > main = putStrLn \"hello\"\n- Comment: --\n- No CLI runner configured"
}
