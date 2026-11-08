import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "langium",
  "displayName": "Langium",
  "version": "1.0.0",
  "extensions": [
    ".langium"
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
      "path": "src/demo.langium",
      "content": "grammar Demo\nentry Model: name=ID;\n"
    },
    {
      "path": "tests/run.langium",
      "content": "grammar Demo\nentry Model: name=ID;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "grammar Demo\nentry Model: name=ID;\n"
    }
  },
  "reference": "Langium syntax reference\n- Example: grammar Demo\n- Comment: //\n- No CLI runner configured"
}
