import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "verse",
  "displayName": "Verse",
  "version": "1.0.0",
  "extensions": [
    ".verse"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\s*(?::|=|<decides>)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|struct|enum|interface)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "using",
      "pattern": "^\\s*using\\s+\\{([^}]+)\\}"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.verse",
      "content": "add(A: int, B: int): int = A + B\n"
    },
    {
      "path": "tests/run.verse",
      "content": "add(A: int, B: int): int = A + B\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "value(A: int): int = A + 1"
    }
  },
  "reference": "Verse syntax reference\n- Function: value(A: int): int = A + 1\n- Class: class Name { ... }\n- Struct: struct Name { ... }\n- Using: using { /Verse.org/Simulation }\n- Variable: Value: int = 1\n- Conditional: if (Condition): ...\n- Comment: # line\n- Run: verse file.verse"
}
