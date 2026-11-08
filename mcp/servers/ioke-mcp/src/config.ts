import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ioke",
  "displayName": "Ioke",
  "version": "1.0.0",
  "extensions": [
    ".ik"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "object",
      "pattern": "^\\s*([A-Z][A-Za-z0-9_]*)\\s*="
    },
    {
      "kind": "method",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*method"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ik",
      "content": "Demo = Origin mimic\nDemo add = method(a, b, a + b)\n"
    },
    {
      "path": "tests/run.ik",
      "content": "Demo = Origin mimic\nDemo add = method(a, b, a + b)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Name = Origin mimic\nName value = method(1)"
    }
  },
  "reference": "Ioke syntax reference\n- Object: Name = Origin mimic\n- Method: Name value = method(1)\n- Cell: Name value = 1\n- Use: use File\n- Text: \"hello\"\n- List: [1, 2, 3]\n- Comment: // line; /* block */\n- Run: ioke file.ik",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
