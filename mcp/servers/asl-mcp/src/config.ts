import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "asl",
  "displayName": "ASL",
  "version": "1.0.0",
  "extensions": [
    ".asl",
    ".dsl"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "method",
      "pattern": "^\\s*Method\\s*\\(\\s*([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.asl",
      "content": "DefinitionBlock (\"demo.aml\", \"DSDT\", 2)\n{\n  Method (MAIN, 0)\n  {\n    Return (2 + 2)\n  }\n}\n"
    },
    {
      "path": "tests/run.asl",
      "content": "DefinitionBlock (\"demo.aml\", \"DSDT\", 2)\n{\n  Method (MAIN, 0)\n  {\n    Return (2 + 2)\n  }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "DefinitionBlock (\"demo.aml\", \"DSDT\", 2)\n{\n  Method (MAIN, 0)\n  {\n    Return (2 + 2)\n  }\n}\n"
    }
  },
  "reference": "ASL syntax reference\n- Example: DefinitionBlock (\"demo.aml\", \"DSDT\", 2)\n- Comment: //\n- Run: iasl {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
