import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "filebench-wml",
  "displayName": "Filebench WML",
  "version": "1.0.0",
  "extensions": [
    ".f"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "definition",
      "pattern": "^\\s*define\\s+(\\w+)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.f",
      "content": "define fileset name=demofiles, path=/tmp, entries=10\nrun 1\n"
    },
    {
      "path": "tests/run.f",
      "content": "define fileset name=demofiles, path=/tmp, entries=10\nrun 1\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "define fileset name=demofiles, path=/tmp, entries=10\nrun 1\n"
    }
  },
  "reference": "Filebench WML syntax reference\n- Example: define fileset name=demofiles, path=/tmp, entries=10\n- Comment: #\n- Run: filebench -f {file}"
}
