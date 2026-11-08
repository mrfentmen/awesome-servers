import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mizar",
  "displayName": "Mizar",
  "version": "1.0.0",
  "extensions": [
    ".miz"
  ],
  "markers": [],
  "comment": "::",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "theorem",
      "pattern": "^\\s*theorem\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.miz",
      "content": "environ\nbegin\ntheorem add: 0 + 0 = 0;\n::end\n"
    },
    {
      "path": "tests/run.miz",
      "content": "environ\nbegin\ntheorem add: 0 + 0 = 0;\n::end\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "environ\nbegin\ntheorem add: 0 + 0 = 0;\n::end\n"
    }
  },
  "reference": "Mizar syntax reference\n- Example: environ"
}
