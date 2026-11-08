import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mps",
  "displayName": "JetBrains MPS",
  "version": "1.0.0",
  "extensions": [
    ".mps",
    ".mpl",
    ".msd"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "concept",
      "pattern": "^\\s*concept\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.mps",
      "content": "concept Demo extends BaseConcept\n  implements INamedConcept\n"
    },
    {
      "path": "tests/run.mps",
      "content": "concept Demo extends BaseConcept\n  implements INamedConcept\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "concept Demo extends BaseConcept\n  implements INamedConcept\n"
    }
  },
  "reference": "JetBrains MPS syntax reference\n- Example: concept Demo extends BaseConcept\n- Comment: //\n- No CLI runner configured",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
