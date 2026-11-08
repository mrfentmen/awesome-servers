import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "il-assembly",
  "displayName": "IL Assembly",
  "version": "1.0.0",
  "extensions": [
    ".il"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "method",
      "pattern": "^\\s*\\.method\\s+.*?([A-Za-z_]\\w*)\\s*\\("
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.il",
      "content": ".assembly Demo {}\n.method static int32 Add(int32 a, int32 b) {\n  ldarg.0\n  ret\n}\n"
    },
    {
      "path": "tests/run.il",
      "content": ".assembly Demo {}\n.method static int32 Add(int32 a, int32 b) {\n  ldarg.0\n  ret\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": ".assembly Demo {}\n.method static int32 Add(int32 a, int32 b) {\n  ldarg.0\n  ret\n}\n"
    }
  },
  "reference": "IL Assembly syntax reference\n- Example: .assembly Demo {}\n- Comment: //\n- Run: ilasm {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
