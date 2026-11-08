import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "earthly",
  "displayName": "Earthly",
  "version": "1.0.0",
  "extensions": [],
  "markers": [
    "Earthfile"
  ],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "target",
      "pattern": "^([A-Za-z0-9_.-]+):\\s*$"
    },
    {
      "kind": "from",
      "pattern": "^\\s*FROM\\s+([^\\s]+)"
    },
    {
      "kind": "run",
      "pattern": "^\\s*RUN\\s+(.+)$"
    },
    {
      "kind": "copy",
      "pattern": "^\\s*COPY\\s+([^\\s]+)"
    }
  ],
  "imports": [
    {
      "kind": "from",
      "pattern": "^\\s*FROM\\s+([^\\s]+)"
    },
    {
      "kind": "copy",
      "pattern": "^\\s*COPY\\s+([^\\s]+)"
    },
    {
      "kind": "do",
      "pattern": "^\\s*DO\\s+([^\\s]+)"
    },
    {
      "kind": "import",
      "pattern": "^\\s*IMPORT\\s+([^\\s]+)"
    }
  ],
  "build": [
    {
      "command": "earthly",
      "args": [
        "+build"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "Earthfile",
      "content": "VERSION 0.8\nFROM alpine:3.20\n\nbuild:\n    RUN echo \"Hello from Earthly\"\n"
    },
    {
      "path": "tests/Earthfile",
      "content": "VERSION 0.8\nFROM alpine:3.20\n\ntest:\n    RUN test \"2\" = \"2\"\n"
    }
  ],
  "snippets": {
    "target": {
      "description": "target",
      "body": "build:\n    RUN echo \"Hello\""
    },
    "from": {
      "description": "base image",
      "body": "FROM alpine:3.20"
    },
    "copy": {
      "description": "copy",
      "body": "COPY src /src"
    }
  },
  "reference": "Earthly / Earthfile syntax reference\n- Version: VERSION 0.8\n- Base: FROM alpine:3.20\n- Target: name:\n- Run: RUN command\n- Copy: COPY source destination\n- Save: SAVE ARTIFACT path\n- Import: IMPORT github.com/org/repo\n- Build: earthly +target"
}
