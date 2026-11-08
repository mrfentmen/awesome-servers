import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "bitbake",
  "displayName": "BitBake",
  "version": "1.0.0",
  "extensions": [
    ".bb",
    ".bbappend",
    ".bbclass",
    ".inc"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^([A-Za-z_][A-Za-z0-9_]*)\\s*\\(\\)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bb",
      "content": "SUMMARY = \"Demo\"\nLICENSE = \"MIT\"\ndo_build() {\n  :\n}\n"
    },
    {
      "path": "tests/run.bb",
      "content": "SUMMARY = \"Demo\"\nLICENSE = \"MIT\"\ndo_build() {\n  :\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "SUMMARY = \"Demo\"\nLICENSE = \"MIT\"\ndo_build() {\n  :\n}\n"
    }
  },
  "reference": "BitBake syntax reference\n- Example: SUMMARY = \"Demo\"\n- Comment: #\n- Run: bitbake -p"
}
