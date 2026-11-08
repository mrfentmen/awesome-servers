import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vb6",
  "displayName": "Visual Basic 6.0",
  "version": "1.0.0",
  "extensions": [
    ".bas",
    ".cls",
    ".frm"
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
      "path": "src/demo.bas",
      "content": "Private Sub Form_Load()\nEnd Sub\n"
    },
    {
      "path": "tests/run.bas",
      "content": "Private Sub Form_Load()\nEnd Sub\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Private Sub Form_Load()\nEnd Sub\n"
    }
  },
  "reference": "Visual Basic 6.0 syntax reference\n- Example: Private Sub Form_Load()\n- Comment: '\n- No CLI runner configured"
}
