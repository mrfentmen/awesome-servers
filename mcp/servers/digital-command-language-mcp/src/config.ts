import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "digital-command-language",
  "displayName": "DIGITAL Command Language",
  "version": "1.0.0",
  "extensions": [
    ".com"
  ],
  "markers": [],
  "comment": "!",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "label",
      "pattern": "^\\$\\s*([A-Za-z_][A-Za-z0-9_]*):"
    },
    {
      "kind": "command",
      "pattern": "^\\$\\s*([A-Z][A-Z0-9_]*)"
    },
    {
      "kind": "symbol",
      "pattern": "^\\$\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=="
    }
  ],
  "imports": [
    {
      "kind": "procedure",
      "pattern": "^\\$\\s*@([^\\s]+)"
    }
  ],
  "scaffold": [
    {
      "path": "HELLO.COM",
      "content": "$ ! Hello from DCL\n$ WRITE SYS$OUTPUT \"Hello from DCL\"\n$ EXIT\n"
    },
    {
      "path": "tests/RUN.COM",
      "content": "$ IF 2 .EQ. 2 THEN WRITE SYS$OUTPUT \"ok\"\n$ EXIT\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": "$ greet:\n$ WRITE SYS$OUTPUT \"hello\""
    },
    "symbol": {
      "description": "symbol",
      "body": "$ NAME == \"value\""
    },
    "loop": {
      "description": "loop",
      "body": "$ LOOP:\n$ WRITE SYS$OUTPUT \"item\"\n$ GOTO LOOP"
    }
  },
  "reference": "DIGITAL Command Language syntax reference\n- Command: $ WRITE SYS$OUTPUT \"text\"\n- Label: $ name:\n- Symbol: $ NAME == \"value\"\n- Condition: $ IF 2 .EQ. 2 THEN ...\n- Loop: $ LOOP: ... $ GOTO LOOP\n- Procedure call: $ @FILE.COM\n- Comment: ! text\n- Exit: $ EXIT"
}
