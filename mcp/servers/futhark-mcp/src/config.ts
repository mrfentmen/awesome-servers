import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "futhark",
  "displayName": "Futhark",
  "version": "1.0.0",
  "extensions": [
    ".fut"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:entry\\s+)?let\\s+([A-Za-z_][A-Za-z0-9_']*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "value",
      "pattern": "^\\s*val\\s+([A-Za-z_][A-Za-z0-9_']*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+\"([^\"]+)"
    },
    {
      "kind": "open",
      "pattern": "^\\s*open\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.fut",
      "content": "let add (a: i32) (b: i32) = a + b\n\nentry main (a: i32) (b: i32) = add a b\n"
    },
    {
      "path": "tests/run.fut",
      "content": "entry main = 2 + 2 == 4\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let name (value: i32) = value + 1"
    },
    "entry": {
      "description": "entry point",
      "body": "entry main (value: i32) = value + 1"
    },
    "map": {
      "description": "map",
      "body": "let values = map (+1) [1, 2, 3]"
    }
  },
  "reference": "Futhark syntax reference\n- Function: let name (value: i32) = value + 1\n- Entry: entry main (value: i32) = value + 1\n- Module: module Name = { ... }\n- Type: type Name = i32\n- Map: map (+1) [1, 2, 3]\n- Reduce: reduce (+) 0 [1, 2, 3]\n- Import: import \"file\"\n- Comment: -- line\n- Compile: futhark c file.fut"
}
