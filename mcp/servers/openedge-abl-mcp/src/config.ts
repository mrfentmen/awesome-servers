import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "openedge-abl",
  "displayName": "OpenEdge ABL",
  "version": "1.0.0",
  "extensions": [
    ".p",
    ".cls",
    ".w"
  ],
  "markers": [],
  "comment": "/*",
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
      "path": "src/demo.p",
      "content": "DEFINE VARIABLE x AS INTEGER NO-UNDO.\n"
    },
    {
      "path": "tests/run.p",
      "content": "DEFINE VARIABLE x AS INTEGER NO-UNDO.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "DEFINE VARIABLE x AS INTEGER NO-UNDO.\n"
    }
  },
  "reference": "OpenEdge ABL syntax reference\n- Example: DEFINE VARIABLE x AS INTEGER NO-UNDO.\n- Comment: /*\n- No CLI runner configured"
}
