import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "xproc",
  "displayName": "XProc",
  "version": "1.0.0",
  "extensions": [
    ".xpl",
    ".xproc"
  ],
  "markers": [],
  "comment": "<!--",
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
      "path": "src/demo.xpl",
      "content": "<p:declare-step xmlns:p=\"http://www.w3.org/ns/xproc\"/>\n"
    },
    {
      "path": "tests/run.xpl",
      "content": "<p:declare-step xmlns:p=\"http://www.w3.org/ns/xproc\"/>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<p:declare-step xmlns:p=\"http://www.w3.org/ns/xproc\"/>\n"
    }
  },
  "reference": "XProc syntax reference\n- Example: <p:declare-step xmlns:p=\"http://www.w3.org/ns/xproc\"/>\n- Comment: <!--\n- No CLI runner configured"
}
