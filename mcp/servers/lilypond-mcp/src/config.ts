import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lilypond",
  "displayName": "LilyPond",
  "version": "1.0.0",
  "extensions": [
    ".ly",
    ".ily"
  ],
  "markers": [],
  "comment": "%",
  "blockComment": {
    "start": "%{",
    "end": "%}"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_-]*)\\s*="
    },
    {
      "kind": "score",
      "pattern": "^\\s*\\\\score"
    },
    {
      "kind": "book",
      "pattern": "^\\s*\\\\book"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*\\\\include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ly",
      "content": "melody = \\relative c' { c4 d e f }\n\n\\score {\n  \\melody\n}\n"
    },
    {
      "path": "tests/run.ly",
      "content": "\\version \"2.24.0\"\n\\relative c' { c4 d e f }\n"
    }
  ],
  "snippets": {
    "variable": {
      "description": "music variable",
      "body": "melody = \\relative c' { c4 d e f }"
    },
    "score": {
      "description": "score",
      "body": "\\score {\n  \\new Staff { c4 d e f }\n}"
    },
    "header": {
      "description": "header",
      "body": "\\header {\n  title = \"Title\"\n}"
    }
  },
  "reference": "LilyPond syntax reference\n- Version: \\version \"2.24.0\"\n- Variable: melody = \\relative c' { c4 d e f }\n- Score: \\score { \\new Staff { ... } }\n- Header: \\header { title = \"Title\" }\n- Relative: \\relative c' { c4 d e f }\n- Include: \\include \"file.ly\"\n- Comment: % line; %{ block %}\n- Render: lilypond file.ly"
}
