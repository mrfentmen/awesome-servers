import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "avisynth",
  "displayName": "AviSynth",
  "version": "1.0.0",
  "extensions": [
    ".avs",
    ".avsi"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.avs",
      "content": "function Add(int a, int b) {\n  return a + b\n}\n"
    },
    {
      "path": "tests/run.avs",
      "content": "function Add(int a, int b) {\n  return a + b\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function Add(int a, int b) {\n  return a + b\n}\n"
    }
  },
  "reference": "AviSynth syntax reference\n- Example: function Add(int a, int b) {\n- Comment: #\n- No CLI runner configured"
}
