import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "metafont",
  "displayName": "METAFONT",
  "version": "1.0.0",
  "extensions": [
    ".mf"
  ],
  "markers": [],
  "comment": "%",
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
      "path": "src/demo.mf",
      "content": "beginchar(\"A\", 10pt#, 10pt#, 0); endchar;\n"
    },
    {
      "path": "tests/run.mf",
      "content": "beginchar(\"A\", 10pt#, 10pt#, 0); endchar;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "beginchar(\"A\", 10pt#, 10pt#, 0); endchar;\n"
    }
  },
  "reference": "METAFONT syntax reference\n- Example: beginchar(\"A\", 10pt#, 10pt#, 0); endchar;\n- Comment: %\n- No CLI runner configured"
}
