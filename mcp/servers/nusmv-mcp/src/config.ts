import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nusmv",
  "displayName": "NuSMV",
  "version": "1.0.0",
  "extensions": [
    ".smv"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*MODULE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.smv",
      "content": "MODULE main\nVAR\n  value : 0..1;\nASSIGN\n  init(value) := 0;\n"
    },
    {
      "path": "tests/run.smv",
      "content": "MODULE main\nVAR\n  value : 0..1;\nASSIGN\n  init(value) := 0;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "MODULE main\nVAR\n  value : 0..1;\nASSIGN\n  init(value) := 0;\n"
    }
  },
  "reference": "NuSMV syntax reference\n- Example: MODULE main"
}
