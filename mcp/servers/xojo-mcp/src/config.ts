import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "xojo",
  "displayName": "Xojo",
  "version": "1.0.0",
  "extensions": [
    ".xojo_code",
    ".xojo_script"
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
      "path": "src/demo.xojo_code",
      "content": "Sub Main()\nEnd Sub\n"
    },
    {
      "path": "tests/run.xojo_code",
      "content": "Sub Main()\nEnd Sub\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Sub Main()\nEnd Sub\n"
    }
  },
  "reference": "Xojo syntax reference\n- Example: Sub Main()\n- Comment: //\n- No CLI runner configured"
}
