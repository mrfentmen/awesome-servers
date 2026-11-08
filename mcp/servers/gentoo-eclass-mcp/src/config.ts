import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gentoo-eclass",
  "displayName": "Gentoo Eclass",
  "version": "1.0.0",
  "extensions": [
    ".eclass"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^([A-Z][A-Z0-9_]*)\\s"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.eclass",
      "content": "# @ECLASS: demo.eclass\nEXPORT_FUNCTIONS src_compile\n"
    },
    {
      "path": "tests/run.eclass",
      "content": "# @ECLASS: demo.eclass\nEXPORT_FUNCTIONS src_compile\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "# @ECLASS: demo.eclass\nEXPORT_FUNCTIONS src_compile\n"
    }
  },
  "reference": "Gentoo Eclass syntax reference\n- Example: # @ECLASS: demo.eclass\n- Comment: #\n- Run: ebuild {file} manifest"
}
