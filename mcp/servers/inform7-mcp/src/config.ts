import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "inform7",
  "displayName": "Inform 7",
  "version": "1.0.0",
  "extensions": [
    ".ni",
    ".i7x"
  ],
  "markers": [],
  "comment": "!",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "room",
      "pattern": "^The\\s+([A-Z][A-Za-z0-9 ]*)\\s+is\\s+a\\s+room"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ni",
      "content": "The Lab is a room.\nThe player is in the Lab.\n"
    },
    {
      "path": "tests/run.ni",
      "content": "The Lab is a room.\nThe player is in the Lab.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "The Lab is a room.\nThe player is in the Lab.\n"
    }
  },
  "reference": "Inform 7 syntax reference\n- Example: The Lab is a room.\n- Comment: !\n- Run: inform7 {file}"
}
