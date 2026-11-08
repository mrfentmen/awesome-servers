import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "kaitai-struct",
  "displayName": "Kaitai Struct",
  "version": "1.0.0",
  "extensions": [
    ".ksy"
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
      "path": "src/demo.ksy",
      "content": "meta:\n  id: demo\nseq:\n  - id: magic\n    type: u4\n"
    },
    {
      "path": "tests/run.ksy",
      "content": "meta:\n  id: demo\nseq:\n  - id: magic\n    type: u4\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "meta:\n  id: demo\nseq:\n  - id: magic\n    type: u4\n"
    }
  },
  "reference": "Kaitai Struct syntax reference\n- Example: meta:\n- Comment: #\n- No CLI runner configured"
}
