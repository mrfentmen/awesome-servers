import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "augeas",
  "displayName": "Augeas",
  "version": "1.0.0",
  "extensions": [
    ".aug"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.aug",
      "content": "module Demo =\n  autoload xfm\n  let value = Rx.word\n"
    },
    {
      "path": "tests/run.aug",
      "content": "module Demo =\n  autoload xfm\n  let value = Rx.word\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module Demo =\n  autoload xfm\n  let value = Rx.word\n"
    }
  },
  "reference": "Augeas syntax reference\n- Example: module Demo =\n- Comment: #\n- Run: augtool --include {dir} -e load"
}
