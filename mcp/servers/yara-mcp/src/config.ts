import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "yara",
  "displayName": "YARA",
  "version": "1.0.0",
  "extensions": [
    ".yar",
    ".yara"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "rule",
      "pattern": "^\\s*(?:private\\s+|global\\s+)?rule\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "string",
      "pattern": "^\\s*\\$([A-Za-z_][A-Za-z0-9_]*)\\s*="
    },
    {
      "kind": "meta",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+\"([^\"]+)"
    },
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "rules/demo.yar",
      "content": "rule Demo {\n  strings:\n    $a = \"demo\"\n  condition:\n    $a\n}\n"
    },
    {
      "path": "tests/run.yar",
      "content": "rule Test {\n  strings:\n    $a = \"ok\"\n  condition:\n    $a\n}\n"
    }
  ],
  "snippets": {
    "rule": {
      "description": "rule",
      "body": "rule Name {\n  strings:\n    $a = \"text\"\n  condition:\n    $a\n}"
    },
    "string": {
      "description": "string",
      "body": "$a = \"text\""
    },
    "import": {
      "description": "import",
      "body": "import \"pe\""
    }
  },
  "reference": "YARA syntax reference\n- Rule: rule Name { strings: ... condition: ... }\n- String: $a = \"text\"\n- Regex: $a = /text/i\n- Condition: $a and filesize < 1MB\n- Meta: author = \"name\"\n- Import: import \"pe\"\n- Include: include \"file.yar\"\n- Comment: // line; /* block */\n- Run: yara rules.yar target"
}
