import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sophia",
  "displayName": "Sophia",
  "version": "1.0.0",
  "extensions": [
    ".aes"
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
      "kind": "function",
      "pattern": "^\\s*entrypoint\\s+([a-z][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([a-z][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.aes",
      "content": "contract Demo =\n  entrypoint add(a : int, b : int) : int = a + b\n"
    },
    {
      "path": "tests/run.aes",
      "content": "contract Demo =\n  entrypoint add(a : int, b : int) : int = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "contract Name =\n  entrypoint value(a : int) : int = a + 1"
    }
  },
  "reference": "Sophia syntax reference\n- Contract: contract Name = ...\n- Entrypoint: entrypoint value(a : int) : int = a + 1\n- Type: type name = int\n- Include: include \"file.aes\"\n- Variable: let value = 1\n- Comment: // line; /* block */\n- Compile: aevm file.aes",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
