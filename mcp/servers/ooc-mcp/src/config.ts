import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ooc",
  "displayName": "ooc",
  "version": "1.0.0",
  "extensions": [
    ".ooc"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:\\s*func"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|cover)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ooc",
      "content": "add: func (a, b: Int) -> Int { a + b }\n"
    },
    {
      "path": "tests/run.ooc",
      "content": "add: func (a, b: Int) -> Int { a + b }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "value: func (a: Int) -> Int { a + 1 }"
    }
  },
  "reference": "ooc syntax reference\n- Function: value: func (a: Int) -> Int { a + 1 }\n- Class: class Name { ... }\n- Cover: cover Name { ... }\n- Use: use math\n- Variable: value: Int = 1\n- Conditional: if (condition) { ... }\n- Loop: for (i in 0..10) { ... }\n- Comment: // line; /* block */\n- Run: rock file.ooc",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
