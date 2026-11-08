import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "literate-coffeescript",
  "displayName": "Literate CoffeeScript",
  "version": "1.0.0",
  "extensions": [
    ".litcoffee",
    ".coffee.md"
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
      "path": "src/demo.litcoffee",
      "content": "A demo.\n\n    square = (x) -> x * x\n"
    },
    {
      "path": "tests/run.litcoffee",
      "content": "A demo.\n\n    square = (x) -> x * x\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "A demo.\n\n    square = (x) -> x * x\n"
    }
  },
  "reference": "Literate CoffeeScript syntax reference\n- Example: A demo.\n- Comment: #\n- No CLI runner configured"
}
