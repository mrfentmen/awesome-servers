import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jasmin",
  "displayName": "Jasmin",
  "version": "1.0.0",
  "extensions": [
    ".j"
  ],
  "markers": [],
  "comment": ";",
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
      "path": "src/demo.j",
      "content": ".class public Demo\n.super java/lang/Object\n.method public static add(II)I\n  iload_0\n  ireturn\n.end method\n"
    },
    {
      "path": "tests/run.j",
      "content": ".class public Demo\n.super java/lang/Object\n.method public static add(II)I\n  iload_0\n  ireturn\n.end method\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": ".class public Demo\n.super java/lang/Object\n.method public static add(II)I\n  iload_0\n  ireturn\n.end method\n"
    }
  },
  "reference": "Jasmin syntax reference\n- Example: .class public Demo\n- Comment: ;\n- Run: jasmin {file}"
}
