import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "prism",
  "displayName": "PRISM",
  "version": "1.0.0",
  "extensions": [
    ".pm"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.pm",
      "content": "module Demo\n  value : [0..1] init 0;\nendmodule\n"
    },
    {
      "path": "tests/run.pm",
      "content": "module Demo\n  value : [0..1] init 0;\nendmodule\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module Demo\n  value : [0..1] init 0;\nendmodule\n"
    }
  },
  "reference": "PRISM syntax reference\n- Example: module Demo"
}
