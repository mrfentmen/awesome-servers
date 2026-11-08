import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "oz",
  "displayName": "Oz",
  "version": "1.0.0",
  "extensions": [
    ".oz"
  ],
  "markers": [],
  "comment": "%",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fun\\s+\\{([A-Za-z_][A-Za-z0-9_]*)\\s+"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*proc\\s+\\{([A-Za-z_][A-Za-z0-9_]*)\\s+"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.oz",
      "content": "fun {Add A B}\n   A + B\nend\n"
    },
    {
      "path": "tests/run.oz",
      "content": "fun {Add A B}\n   A + B\nend\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun {Value A}\n   A + 1\nend"
    }
  },
  "reference": "Oz syntax reference\n- Function: fun {Value A} A + 1 end\n- Procedure: proc {Value A} {Show A} end\n- Class: class Name ... end\n- Import: import Open\n- Variable: A = 1\n- Conditional: if A == 1 then ... else ... end\n- Comment: % line\n- Run: ozengine file.oz"
}
