import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "webvtt",
  "displayName": "WebVTT",
  "version": "1.0.0",
  "extensions": [
    ".vtt"
  ],
  "markers": [],
  "comment": "NOTE",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "definition",
      "pattern": "\\b(?:function|def|fn|fun|func|proc|procedure|sub|method|class|struct|enum|module|namespace|type|interface|trait|record|object|model|table|schema|message|simple|feature|package|policy_module)\\s+([A-Za-z_][\\w:.-]*)"
    },
    {
      "kind": "key",
      "pattern": "^\\s*([A-Za-z_][\\w.-]*)\\s*[:=]"
    },
    {
      "kind": "section",
      "pattern": "^\\s*\\[([^\\]]+)\\]"
    },
    {
      "kind": "tag",
      "pattern": "^\\s*<([A-Za-z][\\w:.-]*)"
    },
    {
      "kind": "block",
      "pattern": "^\\s*([A-Za-z_][\\w.-]*)\\s*[\\{\\[]"
    },
    {
      "kind": "define",
      "pattern": "^\\s*#define\\s+([A-Za-z_]\\w*)"
    },
    {
      "kind": "directive",
      "pattern": "^\\s*\\.([A-Za-z_]\\w*)"
    },
    {
      "kind": "percent",
      "pattern": "^%([A-Za-z0-9_]+)"
    },
    {
      "kind": "header",
      "pattern": "^#\\s*([A-Za-z_][\\w.-]*)\\s*[:=]"
    },
    {
      "kind": "header2",
      "pattern": "^##\\s*([A-Za-z][A-Za-z ]*?)\\s*:"
    },
    {
      "kind": "quoted",
      "pattern": "^\\s*\"([^\"]+)\""
    },
    {
      "kind": "quoted-key",
      "pattern": "\"([^\"]+)\"\\s*:"
    },
    {
      "kind": "domain",
      "pattern": "^\\|\\|([^\\^]+)\\^"
    },
    {
      "kind": "owner",
      "pattern": "@([A-Za-z0-9_-]+)"
    },
    {
      "kind": "percent-fs",
      "pattern": "^%FS([A-Z0-9]+)\\*%"
    },
    {
      "kind": "font",
      "pattern": "^(?:FontName|FONT)\\b\\s*:?\\s*(\\S+)"
    },
    {
      "kind": "hosts",
      "pattern": "^\\S+\\s+(\\S+)"
    },
    {
      "kind": "newmtl",
      "pattern": "^newmtl\\s+(\\w+)"
    },
    {
      "kind": "obj",
      "pattern": "^o\\s+(\\w+)"
    },
    {
      "kind": "schema",
      "pattern": "^SCHEMA\\s+(\\w+)"
    },
    {
      "kind": "flf",
      "pattern": "^(flf2a\\S*)"
    },
    {
      "kind": "hxml",
      "pattern": "^-main\\s+(\\w+)"
    },
    {
      "kind": "host",
      "pattern": "^Host\\s+(\\S+)"
    },
    {
      "kind": "irc",
      "pattern": "<([^>]+)>"
    },
    {
      "kind": "target",
      "pattern": "^Target:\\s*(\\w+)"
    },
    {
      "kind": "project",
      "pattern": "^(Project)\\b"
    },
    {
      "kind": "feature",
      "pattern": "^feature\\s+(\\w+)"
    },
    {
      "kind": "sub",
      "pattern": "^\\.sub\\s+(\\w+)"
    },
    {
      "kind": "pod",
      "pattern": "^=([A-Z]+)"
    },
    {
      "kind": "runoff",
      "pattern": "^\\.([A-Za-z]+)"
    },
    {
      "kind": "rtf",
      "pattern": "\\{\\\\([A-Za-z0-9]+)"
    },
    {
      "kind": "robots",
      "pattern": "^([A-Za-z-]+)\\s*:"
    },
    {
      "kind": "roff",
      "pattern": "^\\.([A-Z]{2})"
    },
    {
      "kind": "selinux",
      "pattern": "policy_module\\((\\w+)"
    },
    {
      "kind": "srecode",
      "pattern": "\\{\\{(\\w+)\\}\\}"
    },
    {
      "kind": "scaml",
      "pattern": "^%([A-Za-z][\\w-]*)"
    },
    {
      "kind": "sugar",
      "pattern": "^\\.([A-Za-z][\\w-]*)"
    },
    {
      "kind": "survex",
      "pattern": "^\\*begin\\s+(\\w+)"
    },
    {
      "kind": "tsplib",
      "pattern": "^([A-Z]+)\\s*:"
    },
    {
      "kind": "textgrid",
      "pattern": "=\\s*\"([^\"]+)\""
    },
    {
      "kind": "type-lang",
      "pattern": "^(\\w+)#"
    },
    {
      "kind": "vdf",
      "pattern": "^\"([^\"]+)\""
    },
    {
      "kind": "wit",
      "pattern": "^package\\s+([\\w:.-]+);"
    },
    {
      "kind": "webvtt",
      "pattern": "^(WEBVTT)"
    },
    {
      "kind": "win32",
      "pattern": "^([A-Za-z]+)="
    },
    {
      "kind": "registry",
      "pattern": "^\\[([A-Za-z_]+)"
    },
    {
      "kind": "xpm",
      "pattern": "^static\\s+char\\s+\\*\\s*(\\w+)\\[\\]"
    },
    {
      "kind": "xcompose",
      "pattern": "^<([A-Za-z0-9_]+)>"
    },
    {
      "kind": "kvlang",
      "pattern": "^<([A-Za-z][\\w-]*)>:"
    },
    {
      "kind": "curl",
      "pattern": "^([A-Za-z][\\w-]*)$"
    },
    {
      "kind": "pkgconfig",
      "pattern": "^([A-Za-z]+)\\s*:"
    },
    {
      "kind": "m3u",
      "pattern": "^#(EXT[A-Z0-9]+)"
    },
    {
      "kind": "darcs",
      "pattern": "^\\[([A-Za-z0-9_-]+)"
    },
    {
      "kind": "cue",
      "pattern": "^([A-Z][A-Z0-9_]*)\\b"
    },
    {
      "kind": "dns",
      "pattern": "\\bIN\\s+([A-Z]+)"
    },
    {
      "kind": "first-word",
      "pattern": "^([A-Za-z][\\w-]*)\\s+"
    },
    {
      "kind": "bird",
      "pattern": "\\bprotocol\\s+(?:static\\s+)?([A-Za-z_][\\w.-]*)"
    },
    {
      "kind": "netlinx",
      "pattern": "^([A-Z_][A-Z0-9_]*)\\s*="
    },
    {
      "kind": "genero",
      "pattern": "^SCHEMA\\s+(\\w+)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*(?:import|include|require|use|using|from|source|load|#include|#import)\\s+[<\\\"']?([^\\\"'\\s;>]+)"
    },
    {
      "kind": "uses",
      "pattern": "^\\s*(?:uses|needs)\\s+(.+)$"
    },
    {
      "kind": "css-import",
      "pattern": "^\\s*@import\\s+[\\\"']([^\\\"']+)"
    },
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+([\\w:.-]+);"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.vtt",
      "content": "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello\n"
    },
    {
      "path": "tests/run.vtt",
      "content": "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello\n"
    }
  ],
  "snippets": {
    "starter": {
      "description": "minimal WebVTT file",
      "body": "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello"
    }
  },
  "reference": "WebVTT syntax reference\n- Extensions: .vtt\n- Comment: NOTE\n- Example: WEBVTT\n- No CLI runner configured."
}
