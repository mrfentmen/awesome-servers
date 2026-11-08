import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "befunge",
  "displayName": "Befunge",
  "version": "1.0.0",
  "extensions": [
    ".bf",
    ".befunge"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "instruction",
      "pattern": "([@])"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bf",
      "content": "\"!dlroW ,olleH\"v\n               >:#,_@\n"
    },
    {
      "path": "tests/run.bf",
      "content": "\"!dlroW ,olleH\"v\n               >:#,_@\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "\"!dlroW ,olleH\"v\n               >:#,_@\n"
    }
  },
  "reference": "Befunge syntax reference\n- Example: \"!dlroW ,olleH\"v\n- Comment: ;\n- No CLI runner configured"
}
