import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "isabelle",
  "displayName": "Isabelle",
  "version": "1.0.0",
  "extensions": [
    ".thy"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "theory",
      "pattern": "^theory\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.thy",
      "content": "theory Demo\n  imports Main\nbegin\nlemma \"2 + 2 = 4\"\n  by simp\nend\n"
    },
    {
      "path": "tests/run.thy",
      "content": "theory Demo\n  imports Main\nbegin\nlemma \"2 + 2 = 4\"\n  by simp\nend\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "theory Demo\n  imports Main\nbegin\nlemma \"2 + 2 = 4\"\n  by simp\nend\n"
    }
  },
  "reference": "Isabelle syntax reference\n- Example: theory Demo\n- Comment: --\n- Run: isabelle process -T {file}",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
