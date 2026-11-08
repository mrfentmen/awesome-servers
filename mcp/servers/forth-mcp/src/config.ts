import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "forth",
  "displayName": "Forth",
  "version": "1.0.0",
  "extensions": [
    ".fth",
    ".4th",
    ".forth",
    ".fr",
    ".frt",
    ".fs"
  ],
  "markers": [],
  "comment": "\\",
  "blockComment": {
    "start": "(",
    "end": ")"
  },
  "stringQuotes": [],
  "symbols": [
    {
      "kind": "word",
      "pattern": "^\\s*:\\s+([^\\s]+)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*variable\\s+([^\\s]+)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*constant\\s+([^\\s]+)"
    },
    {
      "kind": "buffer",
      "pattern": "^\\s*create\\s+([^\\s]+)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+([^\\s]+)"
    },
    {
      "kind": "require",
      "pattern": "^\\s*require\\s+([^\\s]+)"
    },
    {
      "kind": "needs",
      "pattern": "^\\s*needs\\s+([^\\s]+)"
    }
  ],
  "runner": [
    {
      "command": "gforth",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "gforth",
      "args": [
        "tests/run.fth"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.fth",
      "content": ": main .\" Hello from Forth\" cr ;\nmain\n"
    },
    {
      "path": "tests/run.fth",
      "content": "2 2 + . cr\n"
    }
  ],
  "snippets": {
    "word": {
      "description": "colon definition",
      "body": ": name ( input -- output )\n  \\ body\n;"
    },
    "variable": {
      "description": "variable",
      "body": "variable name"
    },
    "loop": {
      "description": "counted loop",
      "body": "10 0 do\n  \\ body\nloop"
    }
  },
  "reference": "Forth syntax reference\n- Colon definition: : name ( stack -- stack ) body ;\n- Stack: dup, drop, swap, over, rot\n- Arithmetic: + - * / mod\n- Output: . (number), .\" text\"\n- Variables: variable name; 0 name !\n- Constants: 42 constant name\n- Comments: \\ line comment and ( stack comment )\n- Include: include file.fth\n- Run with gforth: gforth file.fth"
}
