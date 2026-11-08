import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nearley",
  "displayName": "Nearley",
  "version": "1.0.0",
  "extensions": [
    ".ne",
    ".nearley"
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
      "path": "src/demo.ne",
      "content": "main -> \"a\" {% function(d) { return d[0]; } %}\n"
    },
    {
      "path": "tests/run.ne",
      "content": "main -> \"a\" {% function(d) { return d[0]; } %}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "main -> \"a\" {% function(d) { return d[0]; } %}\n"
    }
  },
  "reference": "Nearley syntax reference\n- Example: main -> \"a\" {% function(d) { return d[0]; } %}\n- Comment: #\n- No CLI runner configured"
}
