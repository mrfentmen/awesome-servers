import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "basic",
  "displayName": "BASIC",
  "version": "1.0.0",
  "extensions": [
    ".bas",
    ".bi"
  ],
  "markers": [],
  "comment": "'",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "subroutine",
      "pattern": "^\\s*(?:SUB|FUNCTION)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*DIM\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*TYPE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*CONST\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*(?:\\$|#)?INCLUDE\\s+(.+)$"
    }
  ],
  "runner": [
    {
      "command": "bwbasic",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "bwbasic",
      "args": [
        "tests/run.bas"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.bas",
      "content": "PRINT \"Hello from BASIC\"\nEND\n"
    },
    {
      "path": "tests/run.bas",
      "content": "IF 2 + 2 <> 4 THEN\n  PRINT \"failed\"\n  END 1\nEND IF\nPRINT \"ok\"\n"
    }
  ],
  "snippets": {
    "sub": {
      "description": "subroutine",
      "body": "SUB Name()\n  ' body\nEND SUB"
    },
    "loop": {
      "description": "for loop",
      "body": "FOR i = 1 TO 10\n  ' body\nNEXT i"
    },
    "input": {
      "description": "input",
      "body": "INPUT \"Name\"; name$"
    }
  },
  "reference": "BASIC syntax reference\n- Print: PRINT \"text\"\n- Variables: name = value; DIM name(10)\n- Strings: \"text\"; string variables end in $\n- Decisions: IF condition THEN ... ELSE ...\n- Loops: FOR i = 1 TO 10 ... NEXT i\n- Subroutines: SUB Name() ... END SUB\n- Functions: FUNCTION Name() ... END FUNCTION\n- Comments: ' comment\n- Include: $INCLUDE file.bi\n- Run with bwbasic: bwbasic file.bas"
}
