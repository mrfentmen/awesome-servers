import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "alpine-abuild",
  "displayName": "Alpine Abuild",
  "version": "1.0.0",
  "extensions": [],
  "markers": [
    "APKBUILD"
  ],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "package",
      "pattern": "^\\s*pkgname=([A-Za-z0-9_.+-]+)"
    },
    {
      "kind": "version",
      "pattern": "^\\s*pkgver=([A-Za-z0-9_.+-]+)"
    },
    {
      "kind": "function",
      "pattern": "^([A-Za-z_][A-Za-z0-9_]*)\\(\\)\\s*\\{"
    },
    {
      "kind": "dependency",
      "pattern": "^\\s*depends=([^\\n]+)"
    }
  ],
  "imports": [
    {
      "kind": "source",
      "pattern": "^\\s*source\\s+([^\\s]+)"
    }
  ],
  "build": [
    {
      "command": "abuild",
      "args": [
        "-r"
      ]
    }
  ],
  "test": [
    {
      "command": "abuild",
      "args": [
        "-r",
        "check"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "APKBUILD",
      "content": "# Maintainer: Bond <bond@example.com>\npkgname={{name}}\npkgver=0.1.0\npkgrel=0\npkgdesc=\"Example package\"\narch=\"all\"\nlicense=\"MIT\"\n\nbuild() {\n  :\n}\n\npackage() {\n  :\n}\n"
    }
  ],
  "snippets": {
    "package": {
      "description": "package metadata",
      "body": "pkgname=name\npkgver=0.1.0\npkgrel=0"
    },
    "build": {
      "description": "build function",
      "body": "build() {\n  make\n}"
    },
    "package-function": {
      "description": "package function",
      "body": "package() {\n  make DESTDIR=\"$pkgdir\" install\n}"
    }
  },
  "reference": "Alpine Abuild syntax reference\n- Package: pkgname=name\n- Version: pkgver=0.1.0; pkgrel=0\n- Description: pkgdesc=\"text\"\n- Architecture: arch=\"all\"\n- License: license=\"MIT\"\n- Build: build() { make }\n- Package: package() { make DESTDIR=\"$pkgdir\" install }\n- Depends: depends=\"musl\"\n- Build package: abuild -r"
}
