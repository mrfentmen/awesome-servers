import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "please",
  "displayName": "Please",
  "version": "1.0.0",
  "extensions": [
    ".plz"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "target",
      "pattern": "^\\s*name\\s*=\\s*\"([^\"]+)\""
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.plz",
      "content": "python_library(\n  name = \"demo\",\n  srcs = [\"demo.py\"],\n)\n"
    },
    {
      "path": "tests/run.plz",
      "content": "python_library(\n  name = \"demo\",\n  srcs = [\"demo.py\"],\n)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "python_library(\n  name = \"demo\",\n  srcs = [\"demo.py\"],\n)\n"
    }
  },
  "reference": "Please syntax reference\n- Example: python_library("
}
