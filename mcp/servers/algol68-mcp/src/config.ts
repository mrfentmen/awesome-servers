import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "algol68",
  "displayName": "ALGOL 68",
  "version": "1.0.0",
  "extensions": [
    ".alg",
    ".a68"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "procedure",
      "pattern": "^\\s*PROC\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.alg",
      "content": "BEGIN\n  PROC main = VOID:\n  BEGIN\n    print((2 + 2))\n  END;\n  main\nEND\n"
    },
    {
      "path": "tests/run.alg",
      "content": "BEGIN\n  PROC main = VOID:\n  BEGIN\n    print((2 + 2))\n  END;\n  main\nEND\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "BEGIN\n  PROC main = VOID:\n  BEGIN\n    print((2 + 2))\n  END;\n  main\nEND\n"
    }
  },
  "reference": "ALGOL 68 syntax reference\n- Example: BEGIN\n- Comment: #\n- Run: a68g {file}"
}
