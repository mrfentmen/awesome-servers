import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vdm-sl",
  "displayName": "VDM-SL",
  "version": "1.0.0",
  "extensions": [
    ".vdm"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*:\\s*[a-z]"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.vdm",
      "content": "functions\n  add : int * int -> int\n  add(a, b) == a + b\n"
    },
    {
      "path": "tests/run.vdm",
      "content": "functions\n  add : int * int -> int\n  add(a, b) == a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "functions\n  add : int * int -> int\n  add(a, b) == a + b\n"
    }
  },
  "reference": "VDM-SL syntax reference\n- Example: functions"
}
