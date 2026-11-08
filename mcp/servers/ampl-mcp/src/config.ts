import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ampl",
  "displayName": "AMPL",
  "version": "1.0.0",
  "extensions": [
    ".ampl",
    ".mod",
    ".dat"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "parameter",
      "pattern": "^\\s*param\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ampl",
      "content": "param limit = 10;\nvar x >= 0;\nminimize cost: x;\nsubject to cap: x <= limit;\n"
    },
    {
      "path": "tests/run.ampl",
      "content": "param limit = 10;\nvar x >= 0;\nminimize cost: x;\nsubject to cap: x <= limit;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "param limit = 10;\nvar x >= 0;\nminimize cost: x;\nsubject to cap: x <= limit;\n"
    }
  },
  "reference": "AMPL syntax reference\n- Example: param limit = 10;\n- Comment: #\n- Run: ampl {file}"
}
