import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "terra",
  "displayName": "Terra",
  "version": "1.0.0",
  "extensions": [
    ".t"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*terra\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*local\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.t",
      "content": "terra add(a: int, b: int): int\n  return a + b\nend\n"
    },
    {
      "path": "tests/run.t",
      "content": "terra add(a: int, b: int): int\n  return a + b\nend\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "terra value(a: int): int\n  return a + 1\nend"
    }
  },
  "reference": "Terra syntax reference\n- Function: terra value(a: int): int return a + 1 end\n- Struct: struct Name { value: int }\n- Local: local value = 1\n- Import: import \"lib\"\n- Conditional: if condition then ... end\n- Loop: for i = 0, 10 do ... end\n- Comment: -- line\n- Run: terra file.t"
}
