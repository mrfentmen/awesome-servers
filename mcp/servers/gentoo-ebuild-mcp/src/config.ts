import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gentoo-ebuild",
  "displayName": "Gentoo Ebuild",
  "version": "1.0.0",
  "extensions": [
    ".ebuild"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "variable",
      "pattern": "^([A-Z][A-Z0-9_]*)="
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ebuild",
      "content": "EAPI=8\nDESCRIPTION=\"Demo\"\nSLOT=\"0\"\n"
    },
    {
      "path": "tests/run.ebuild",
      "content": "EAPI=8\nDESCRIPTION=\"Demo\"\nSLOT=\"0\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "EAPI=8\nDESCRIPTION=\"Demo\"\nSLOT=\"0\"\n"
    }
  },
  "reference": "Gentoo Ebuild syntax reference\n- Example: EAPI=8\n- Comment: #\n- Run: ebuild {file} manifest"
}
