import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vbnet",
  "displayName": "Visual Basic .NET",
  "version": "1.0.0",
  "extensions": [
    ".vb",
    ".vbhtml"
  ],
  "markers": [],
  "comment": "'",
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
      "path": "src/demo.vb",
      "content": "Module Main\n  Sub Main()\n  End Sub\nEnd Module\n"
    },
    {
      "path": "tests/run.vb",
      "content": "Module Main\n  Sub Main()\n  End Sub\nEnd Module\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Module Main\n  Sub Main()\n  End Sub\nEnd Module\n"
    }
  },
  "reference": "Visual Basic .NET syntax reference\n- Example: Module Main\n- Comment: '\n- No CLI runner configured"
}
