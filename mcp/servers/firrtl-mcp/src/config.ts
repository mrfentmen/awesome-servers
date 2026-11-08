import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "firrtl",
  "displayName": "FIRRTL",
  "version": "1.0.0",
  "extensions": [
    ".fir"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "circuit",
      "pattern": "^\\s*circuit\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.fir",
      "content": "circuit Demo :\n  module Demo :\n    input a : UInt<1>\n"
    },
    {
      "path": "tests/run.fir",
      "content": "circuit Demo :\n  module Demo :\n    input a : UInt<1>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "circuit Demo :\n  module Demo :\n    input a : UInt<1>\n"
    }
  },
  "reference": "FIRRTL syntax reference\n- Example: circuit Demo :\n- Comment: ;\n- Run: firrtl -i {file}"
}
