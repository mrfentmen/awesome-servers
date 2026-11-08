import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "csound-score",
  "displayName": "Csound Score",
  "version": "1.0.0",
  "extensions": [
    ".sco"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "instrument",
      "pattern": "^\\s*(i\\d+)\\s+"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.sco",
      "content": "i1 0 1 440\n"
    },
    {
      "path": "tests/run.sco",
      "content": "i1 0 1 440\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "i1 0 1 440\n"
    }
  },
  "reference": "Csound Score syntax reference\n- Example: i1 0 1 440\n- Comment: ;\n- Run: csound {file}"
}
