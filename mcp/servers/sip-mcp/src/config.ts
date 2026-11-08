import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sip",
  "displayName": "SIP",
  "version": "1.0.0",
  "extensions": [
    ".sip"
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
      "path": "src/demo.sip",
      "content": "class Demo : public QObject {};\n"
    },
    {
      "path": "tests/run.sip",
      "content": "class Demo : public QObject {};\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Demo : public QObject {};\n"
    }
  },
  "reference": "SIP syntax reference\n- Example: class Demo : public QObject {};\n- Comment: //\n- No CLI runner configured"
}
