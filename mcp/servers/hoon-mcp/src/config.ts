import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "hoon",
  "displayName": "hoon",
  "version": "1.0.0",
  "extensions": [
    ".hoon"
  ],
  "markers": [],
  "comment": "::",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\|\\^\\s+([a-z][\\w-]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.hoon",
      "content": "|^  add  |=  [a=@ b=@]\n  (add a b)\n"
    },
    {
      "path": "tests/run.hoon",
      "content": "|^  add  |=  [a=@ b=@]\n  (add a b)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "|^  add  |=  [a=@ b=@]\n  (add a b)\n"
    }
  },
  "reference": "hoon syntax reference\n- Example: |^  add  |=  [a=@ b=@]\n- Comment: ::\n- Run: urbit -k {file}"
}
