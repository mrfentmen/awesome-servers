import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "aspectj",
  "displayName": "AspectJ",
  "version": "1.0.0",
  "extensions": [
    ".aj"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "aspect",
      "pattern": "^\\s*(?:public\\s+)?aspect\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.aj",
      "content": "public aspect Logging {\n  pointcut calls(): call(* *(..));\n}\n"
    },
    {
      "path": "tests/run.aj",
      "content": "public aspect Logging {\n  pointcut calls(): call(* *(..));\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "public aspect Logging {\n  pointcut calls(): call(* *(..));\n}\n"
    }
  },
  "reference": "AspectJ syntax reference\n- Example: public aspect Logging {\n- Comment: //\n- Run: ajc {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
