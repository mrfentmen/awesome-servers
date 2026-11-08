import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "michelson",
  "displayName": "Michelson",
  "version": "1.0.0",
  "extensions": [
    ".tz"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "parameter",
      "pattern": "^\\s*(parameter)\\b"
    },
    {
      "kind": "storage",
      "pattern": "^\\s*(storage)\\b"
    },
    {
      "kind": "code",
      "pattern": "^\\s*(code)\\b"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.tz",
      "content": "parameter int;\nstorage int;\ncode { UNPAIR; ADD; NIL operation; PAIR };\n"
    },
    {
      "path": "tests/run.tz",
      "content": "parameter int;\nstorage int;\ncode { UNPAIR; ADD; NIL operation; PAIR };\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "parameter int;\nstorage int;\ncode { CDR; NIL operation; PAIR };"
    }
  },
  "reference": "Michelson syntax reference\n- Parameter: parameter int;\n- Storage: storage int;\n- Code: code { UNPAIR; ADD; NIL operation; PAIR };\n- Instruction: ADD;\n- Stack: int : int : []\n- Comment: # line\n- Run: octez-client run script file.tz"
}
