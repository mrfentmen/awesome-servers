import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "buck",
  "displayName": "Buck",
  "version": "1.0.0",
  "extensions": [
    ".buck"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "rule",
      "pattern": "^\\s*name\\s*=\\s*\"([^\"]+)\""
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.buck",
      "content": "genrule(\n  name = \"demo\",\n  out = \"demo.txt\",\n  cmd = \"echo demo > $OUT\",\n)\n"
    },
    {
      "path": "tests/run.buck",
      "content": "genrule(\n  name = \"demo\",\n  out = \"demo.txt\",\n  cmd = \"echo demo > $OUT\",\n)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "genrule(\n  name = \"demo\",\n  out = \"demo.txt\",\n  cmd = \"echo demo > $OUT\",\n)\n"
    }
  },
  "reference": "Buck syntax reference\n- Example: genrule("
}
