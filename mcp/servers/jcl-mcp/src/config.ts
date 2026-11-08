import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jcl",
  "displayName": "JCL",
  "version": "1.0.0",
  "extensions": [
    ".jcl"
  ],
  "markers": [],
  "comment": "//*",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "job",
      "pattern": "^//([A-Z0-9]+)\\s+JOB"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.jcl",
      "content": "//DEMO    JOB (ACCT),'DEMO'\n//STEP1   EXEC PGM=IEFBR14\n"
    },
    {
      "path": "tests/run.jcl",
      "content": "//DEMO    JOB (ACCT),'DEMO'\n//STEP1   EXEC PGM=IEFBR14\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "//DEMO    JOB (ACCT),'DEMO'\n//STEP1   EXEC PGM=IEFBR14\n"
    }
  },
  "reference": "JCL syntax reference\n- Example: //DEMO    JOB (ACCT),'DEMO'\n- Comment: //*\n- No CLI runner configured"
}
