import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mojo",
  "displayName": "Mojo",
  "version": "1.0.0",
  "extensions": [
    ".mojo"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fn\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "def",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "trait",
      "pattern": "^\\s*trait\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "alias",
      "pattern": "^\\s*alias\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "from",
      "pattern": "^\\s*from\\s+([A-Za-z0-9_.]+)\\s+import"
    },
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/hello.mojo",
      "content": "fn add(value: Int) -> Int:\n    return value + 1\n\nfn main():\n    print(add(41))\n"
    },
    {
      "path": "tests/run.mojo",
      "content": "fn test_add():\n    assert add(2) == 3\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn name(value: Int) -> Int:\n    return value + 1"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name:\n    var value: Int"
    },
    "main": {
      "description": "main",
      "body": "fn main():\n    print(\"Hello\")"
    }
  },
  "reference": "Mojo syntax reference\n- Function: fn name(value: Int) -> Int: return value + 1\n- Def: def name(value): return value\n- Struct: struct Name: var value: Int\n- Trait: trait Name: fn get(self) -> Int\n- Alias: alias NAME = Int\n- Variable: var value: Int = 1\n- Import: from path import Name\n- Comment: # line\n- Run: mojo file.mojo"
}
