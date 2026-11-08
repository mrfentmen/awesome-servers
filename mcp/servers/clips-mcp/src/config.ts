import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "clips",
  "displayName": "CLIPS",
  "version": "1.0.0",
  "extensions": [
    ".clp"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "rule",
      "pattern": "^\\s*\\(defrule\\s+([A-Za-z_][\\w-]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.clp",
      "content": "(defrule hello\n  (initial-fact)\n  =>\n  (printout t \"hello\" crlf))\n"
    },
    {
      "path": "tests/run.clp",
      "content": "(defrule hello\n  (initial-fact)\n  =>\n  (printout t \"hello\" crlf))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(defrule hello\n  (initial-fact)\n  =>\n  (printout t \"hello\" crlf))\n"
    }
  },
  "reference": "CLIPS syntax reference\n- Example: (defrule hello\n- Comment: ;\n- Run: clips -f {file}"
}
