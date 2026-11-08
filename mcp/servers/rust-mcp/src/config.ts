import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rust",
  "displayName": "Rust",
  "version": "1.0.0",
  "extensions": [
    ".rs"
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
      "path": "src/demo.rs",
      "content": "fn add(a: i32, b: i32) -> i32 { a + b }\n"
    },
    {
      "path": "tests/run.rs",
      "content": "fn add(a: i32, b: i32) -> i32 { a + b }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn add(a: i32, b: i32) -> i32 { a + b }\n"
    }
  },
  "reference": "Rust syntax reference\n- Example: fn add(a: i32, b: i32) -> i32 { a + b }\n- Comment: //\n- No CLI runner configured"
}
