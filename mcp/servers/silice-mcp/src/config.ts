import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "silice",
  "displayName": "Silice",
  "version": "1.0.0",
  "extensions": [
    ".silice"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "algorithm",
      "pattern": "^\\s*algorithm\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.silice",
      "content": "algorithm add(input uint8 a, input uint8 b, output uint8 c) {\n  c := a + b;\n}\n"
    },
    {
      "path": "tests/run.silice",
      "content": "algorithm add(input uint8 a, input uint8 b, output uint8 c) {\n  c := a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "algorithm add(input uint8 a, input uint8 b, output uint8 c) {\n  c := a + b;\n}\n"
    }
  },
  "reference": "Silice syntax reference\n- Example: algorithm add(input uint8 a, input uint8 b, output uint8 c) {"
}
