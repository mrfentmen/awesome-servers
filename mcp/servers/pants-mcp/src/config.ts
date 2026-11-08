import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pants",
  "displayName": "Pants",
  "version": "1.0.0",
  "extensions": [
    ".pants"
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
      "path": "src/demo.pants",
      "content": "python_sources(\n  name = \"demo\",\n  sources = [\"*.py\"],\n)\n"
    },
    {
      "path": "tests/run.pants",
      "content": "python_sources(\n  name = \"demo\",\n  sources = [\"*.py\"],\n)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "python_sources(\n  name = \"demo\",\n  sources = [\"*.py\"],\n)\n"
    }
  },
  "reference": "Pants syntax reference\n- Example: python_sources("
}
