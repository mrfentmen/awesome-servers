import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dogescript",
  "displayName": "Dogescript",
  "version": "1.0.0",
  "extensions": [
    ".djs"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*such\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.djs",
      "content": "such add\n  much a\n  much b\n  wow a + b\n"
    },
    {
      "path": "tests/run.djs",
      "content": "such add\n  much a\n  much b\n  wow a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "such add\n  much a\n  much b\n  wow a + b\n"
    }
  },
  "reference": "Dogescript syntax reference\n- Example: such add\n- Comment: //\n- Run: doge {file}"
}
