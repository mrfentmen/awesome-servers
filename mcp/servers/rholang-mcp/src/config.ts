import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rholang",
  "displayName": "Rholang",
  "version": "1.0.0",
  "extensions": [
    ".rho"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "contract",
      "pattern": "^\\s*contract\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "new",
      "pattern": "^\\s*new\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.rho",
      "content": "contract Demo = {\n  new add in {\n    add!(1 + 2)\n  }\n}\n"
    },
    {
      "path": "tests/run.rho",
      "content": "contract Demo = {\n  new add in {\n    add!(1 + 2)\n  }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "contract Name = {\n  new value in {\n    value!(1)\n  }\n}"
    }
  },
  "reference": "Rholang syntax reference\n- Contract: contract Name = { ... }\n- New: new value in { ... }\n- Send: value!(1)\n- Receive: for (x <- value) { ... }\n- Import: import RhoStdlib\n- Variable: let value = 1\n- Comment: // line; /* block */\n- Run: rnode file.rho",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
