import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "bibtex-style",
  "displayName": "BibTeX Style",
  "version": "1.0.0",
  "extensions": [
    ".bst"
  ],
  "markers": [],
  "comment": "%",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "FUNCTION\\s+\\{([^}]+)\\}"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bst",
      "content": "FUNCTION {article}\n{ output.bibitem\n  fin.entry\n}\n"
    },
    {
      "path": "tests/run.bst",
      "content": "FUNCTION {article}\n{ output.bibitem\n  fin.entry\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "FUNCTION {article}\n{ output.bibitem\n  fin.entry\n}\n"
    }
  },
  "reference": "BibTeX Style syntax reference\n- Example: FUNCTION {article}\n- Comment: %\n- Run: bibtex {file}"
}
