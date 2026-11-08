import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "turing",
  "displayName": "Turing",
  "version": "1.0.0",
  "extensions": [
    ".t",
    ".tu"
  ],
  "markers": [],
  "comment": "%",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*procedure\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.t",
      "content": "function add(a, b : int) : int\n    result a + b\nend add\n"
    },
    {
      "path": "tests/run.t",
      "content": "function add(a, b : int) : int\n    result a + b\nend add\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function value(a : int) : int\n    result a + 1\nend value"
    }
  },
  "reference": "Turing syntax reference\n- Function: function value(a : int) : int result a + 1 end value\n- Procedure: procedure value(a : int) put a end value\n- Type: type Name : record value : int end record\n- Include: include \"file.tu\"\n- Variable: var value : int := 1\n- Comment: % line\n- Run: tprog file.t"
}
