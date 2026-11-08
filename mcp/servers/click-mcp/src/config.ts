import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "click",
  "displayName": "Click",
  "version": "1.0.0",
  "extensions": [
    ".click"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "definition",
      "pattern": "^\\s*define\\s*\\(\\s*\\$?([A-Za-z_][\\w]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.click",
      "content": "define($x 1);\nprint($x);\n"
    },
    {
      "path": "tests/run.click",
      "content": "define($x 1);\nprint($x);\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "define($x 1);\nprint($x);\n"
    }
  },
  "reference": "Click syntax reference\n- Example: define($x 1);\n- Comment: //\n- No CLI runner configured"
}
