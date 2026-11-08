import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "coffeescript",
  "displayName": "CoffeeScript",
  "version": "1.0.0",
  "extensions": [
    ".coffee",
    ".cake",
    ".cjsx"
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
      "path": "src/demo.coffee",
      "content": "square = (x) -> x * x\n"
    },
    {
      "path": "tests/run.coffee",
      "content": "square = (x) -> x * x\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "square = (x) -> x * x\n"
    }
  },
  "reference": "CoffeeScript syntax reference\n- Example: square = (x) -> x * x\n- Comment: #\n- No CLI runner configured"
}
