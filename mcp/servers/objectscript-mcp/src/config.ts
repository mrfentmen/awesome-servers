import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "objectscript",
  "displayName": "ObjectScript",
  "version": "1.0.0",
  "extensions": [
    ".cls"
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
      "path": "src/demo.cls",
      "content": "Class Demo { ClassMethod Add(a, b) { Quit a+b } }\n"
    },
    {
      "path": "tests/run.cls",
      "content": "Class Demo { ClassMethod Add(a, b) { Quit a+b } }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Class Demo { ClassMethod Add(a, b) { Quit a+b } }\n"
    }
  },
  "reference": "ObjectScript syntax reference\n- Example: Class Demo { ClassMethod Add(a, b) { Quit a+b } }\n- Comment: //\n- No CLI runner configured"
}
