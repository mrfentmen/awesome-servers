import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "kolmafia-ash",
  "displayName": "KoLmafia ASH",
  "version": "1.0.0",
  "extensions": [
    ".ash"
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
      "path": "src/demo.ash",
      "content": "void main() { print(\"hello\"); }\n"
    },
    {
      "path": "tests/run.ash",
      "content": "void main() { print(\"hello\"); }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "void main() { print(\"hello\"); }\n"
    }
  },
  "reference": "KoLmafia ASH syntax reference\n- Example: void main() { print(\"hello\"); }\n- Comment: //\n- No CLI runner configured"
}
