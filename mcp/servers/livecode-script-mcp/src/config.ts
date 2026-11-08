import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "livecode-script",
  "displayName": "LiveCode Script",
  "version": "1.0.0",
  "extensions": [
    ".livecodescript"
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
      "path": "src/demo.livecodescript",
      "content": "on mouseUp\n  put \"hello\"\nend mouseUp\n"
    },
    {
      "path": "tests/run.livecodescript",
      "content": "on mouseUp\n  put \"hello\"\nend mouseUp\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "on mouseUp\n  put \"hello\"\nend mouseUp\n"
    }
  },
  "reference": "LiveCode Script syntax reference\n- Example: on mouseUp\n- Comment: #\n- No CLI runner configured"
}
