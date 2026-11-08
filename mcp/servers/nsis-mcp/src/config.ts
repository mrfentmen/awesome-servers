import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nsis",
  "displayName": "NSIS",
  "version": "1.0.0",
  "extensions": [
    ".nsi",
    ".nsh"
  ],
  "markers": [],
  "comment": ";",
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
      "path": "src/demo.nsi",
      "content": "Section\n  MessageBox MB_OK \"Hello\"\nSectionEnd\n"
    },
    {
      "path": "tests/run.nsi",
      "content": "Section\n  MessageBox MB_OK \"Hello\"\nSectionEnd\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Section\n  MessageBox MB_OK \"Hello\"\nSectionEnd\n"
    }
  },
  "reference": "NSIS syntax reference\n- Example: Section\n- Comment: ;\n- No CLI runner configured"
}
