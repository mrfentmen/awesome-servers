import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "qmake",
  "displayName": "QMake",
  "version": "1.0.0",
  "extensions": [
    ".pro",
    ".pri"
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
      "path": "src/demo.pro",
      "content": "SOURCES += main.cpp\n"
    },
    {
      "path": "tests/run.pro",
      "content": "SOURCES += main.cpp\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "SOURCES += main.cpp\n"
    }
  },
  "reference": "QMake syntax reference\n- Example: SOURCES += main.cpp\n- Comment: #\n- No CLI runner configured"
}
