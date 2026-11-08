import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "snakemake",
  "displayName": "Snakemake",
  "version": "1.0.0",
  "extensions": [
    ".smk",
    ".snakefile"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "\\b(?:function|def|fn|fun|func|proc|procedure|sub|method|class|struct|enum|module|namespace|type|interface|trait|record|object)\\s+([A-Za-z_]\\w*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:[A-Za-z_][\\w<>\\[\\]]*\\s+)+([A-Za-z_]\\w*)\\s*\\("
    },
    {
      "kind": "value",
      "pattern": "^([A-Za-z_]\\w*)\\s*(?::=|=|:)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.smk",
      "content": "rule all:\n  input: \"out.txt\"\n"
    },
    {
      "path": "tests/run.smk",
      "content": "rule all:\n  input: \"out.txt\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "rule all:\n  input: \"out.txt\"\n"
    }
  },
  "reference": "Snakemake syntax reference\n- Example: rule all:\n- Comment: #\n- No CLI runner configured"
}
