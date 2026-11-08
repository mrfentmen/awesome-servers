import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "openrc-runscript",
  "displayName": "OpenRC runscript",
  "version": "1.0.0",
  "extensions": [
    ".txt"
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
      "path": "src/demo.txt",
      "content": "#!/sbin/openrc-run\ncommand=/bin/echo\n"
    },
    {
      "path": "tests/run.txt",
      "content": "#!/sbin/openrc-run\ncommand=/bin/echo\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "#!/sbin/openrc-run\ncommand=/bin/echo\n"
    }
  },
  "reference": "OpenRC runscript syntax reference\n- Example: #!/sbin/openrc-run\n- Comment: #\n- No CLI runner configured"
}
