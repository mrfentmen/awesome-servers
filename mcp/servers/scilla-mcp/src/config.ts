import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "scilla",
  "displayName": "Scilla",
  "version": "1.0.0",
  "extensions": [
    ".scilla"
  ],
  "markers": [],
  "comment": "(*",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "library",
      "pattern": "^\\s*library\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+([a-z][A-Za-z0-9_]*)"
    },
    {
      "kind": "contract",
      "pattern": "^\\s*contract\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.scilla",
      "content": "scilla_version 0\n\nlibrary Demo\n\nlet add = fun (a : Int32, b : Int32) => a + b\n"
    },
    {
      "path": "tests/run.scilla",
      "content": "scilla_version 0\n\nlibrary Demo\n\nlet add = fun (a : Int32, b : Int32) => a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "scilla_version 0\n\nlibrary Name\n\nlet value = fun (a : Int32) => a + 1\n"
    }
  },
  "reference": "Scilla syntax reference\n- Version: scilla_version 0\n- Library: library Name\n- Function: let value = fun (a : Int32) => a + 1\n- Contract: contract Name (...)\n- Import: import List\n- Transition: transition Name() ... end\n- Comment: (* block *)\n- Run: scilla-runner file.scilla",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
