import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "marlowe",
  "displayName": "Marlowe",
  "version": "1.0.0",
  "extensions": [
    ".marlowe"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+([a-z][A-Za-z0-9_']*)"
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
      "path": "src/demo.marlowe",
      "content": "let add = \\a b -> a + b\n"
    },
    {
      "path": "tests/run.marlowe",
      "content": "let add = \\a b -> a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let value = \\a -> a + 1"
    }
  },
  "reference": "Marlowe syntax reference\n- Function: let value = \\a -> a + 1\n- Contract: contract Name = ...\n- Import: import Marlowe\n- Variable: let value = 1\n- Conditional: if condition then ... else ...\n- Comment: -- line; {- block -}\n- Run: marlowe-cli file.marlowe",
  "blockComment": {
    "start": "{-",
    "end": "-}"
  }
}
