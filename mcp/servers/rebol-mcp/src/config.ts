import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rebol",
  "displayName": "Rebol",
  "version": "1.0.0",
  "extensions": [
    ".reb",
    ".r",
    ".r2",
    ".r3",
    ".rebol"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_-]*):\\s*func"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_-]*):\\s*function"
    },
    {
      "kind": "object",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_-]*):\\s*object"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_./-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.reb",
      "content": "add: func [a b] [a + b]\n"
    },
    {
      "path": "tests/run.reb",
      "content": "add: func [a b] [a + b]\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "value: func [a] [a + 1]"
    }
  },
  "reference": "Rebol syntax reference\n- Function: value: func [a] [a + 1]\n- Object: name: object [value: 1]\n- Import: import %file.reb\n- Variable: value: 1\n- Conditional: either condition [ ... ] [ ... ]\n- Loop: repeat i 10 [ ... ]\n- Comment: ; line\n- Run: rebol file.reb"
}
