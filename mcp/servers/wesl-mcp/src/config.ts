import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "wesl",
  "displayName": "WESL",
  "version": "1.0.0",
  "extensions": [
    ".wesl"
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
      "path": "src/demo.wesl",
      "content": "fn main() { }\n"
    },
    {
      "path": "tests/run.wesl",
      "content": "fn main() { }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn main() { }\n"
    }
  },
  "reference": "WESL syntax reference\n- Example: fn main() { }\n- Comment: //\n- No CLI runner configured"
}
