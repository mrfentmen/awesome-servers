import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dockerfile",
  "displayName": "Dockerfile",
  "version": "1.0.0",
  "extensions": [
    ".dockerfile",
    ".containerfile"
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
      "path": "src/demo.dockerfile",
      "content": "FROM alpine\nRUN echo hello\n"
    },
    {
      "path": "tests/run.dockerfile",
      "content": "FROM alpine\nRUN echo hello\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "FROM alpine\nRUN echo hello\n"
    }
  },
  "reference": "Dockerfile syntax reference\n- Example: FROM alpine\n- Comment: #\n- No CLI runner configured"
}
