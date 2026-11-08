import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "capn-proto",
  "displayName": "Cap'n Proto",
  "version": "1.0.0",
  "extensions": [
    ".capnp"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.capnp",
      "content": "@0xabcdef1234567890;\nstruct Person {\n  name @0 :Text;\n}\n"
    },
    {
      "path": "tests/run.capnp",
      "content": "@0xabcdef1234567890;\nstruct Person {\n  name @0 :Text;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "@0xabcdef1234567890;\nstruct Person {\n  name @0 :Text;\n}\n"
    }
  },
  "reference": "Cap'n Proto syntax reference\n- Example: @0xabcdef1234567890;\n- Comment: #\n- Run: capnp compile {file}"
}
