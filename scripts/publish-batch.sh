#!/bin/bash
# Publish a slice of servers to npm + MCP registry. Idempotent: skips
# versions already live. Re-logs in to the registry every 40 publishes
# because registry JWTs are short-lived.
# Usage: publish-batch.sh [start] [end]  (1-based indices into sorted server list)
set -u
START=${1:-1}
END=${2:-0}
cd "$(dirname "$0")/.."

ALL=$(ls -d servers/*/ | sed 's|servers/||;s|/||' | sort)
TOTAL=$(echo "$ALL" | wc -l | tr -d ' ')
[ "$END" -eq 0 ] && END=$TOTAL
echo "publishing $START..$END of $TOTAL"

PUB=${PUBLISHER_BIN:-mcp-publisher}
N=0
echo "$ALL" | sed -n "${START},${END}p" | while read -r s; do
  [ -z "$s" ] && continue
  N=$((N + 1))
  if [ $((N % 40)) -eq 1 ]; then
    echo "--- (re)login to registry ---"
    $PUB login github-oidc || { echo "LOGIN-FAIL"; exit 1; }
  fi
  d="servers/$s"
  NAME=$(python3 -c "import json; print(json.load(open('$d/package.json'))['name'])")
  VER=$(python3 -c "import json; print(json.load(open('$d/package.json'))['version'])")
  REGNAME="io.github.mrfentmen/$s"
  REGVER=$(curl -s -m 15 "https://registry.modelcontextprotocol.io/v0/servers?search=$s" | python3 -c "
import json,sys
try:
    d = json.load(sys.stdin)
    vs = [x['server']['version'] for x in d.get('servers',[]) if x['server']['name'] == '$REGNAME']
    print(max(vs) if vs else '')
except Exception:
    print('')
" 2>/dev/null)
  if [ -n "$REGVER" ] && [ "$(printf '%s\n%s' "$REGVER" "$VER" | sort -V | tail -1)" = "$REGVER" ]; then echo "OK:$s:already-live"; continue; fi
  ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$NAME")
  HAVE=$(curl -s -m 15 "https://registry.npmjs.org/$ENC" | python3 -c "import json,sys; print(' '.join(json.load(sys.stdin).get('versions',{}).keys()))" 2>/dev/null)
  if ! echo " $HAVE " | grep -q " $VER "; then
    ( cd "$d" && npm install --no-audit --no-fund >/dev/null 2>&1; ./node_modules/.bin/tsc -p tsconfig.json >/dev/null 2>&1 ) || { echo "FAIL:$s:build"; continue; }
    if ! ( cd "$d" && npm publish --access public 2>&1 | grep -qE "^\+\s" ); then echo "FAIL:$s:npm"; continue; fi
  fi
  if ( cd "$d" && $PUB publish 2>&1 | grep -qiE "successfully published" ); then
    echo "OK:$s"
  else
    if ( cd "$d" && $PUB publish 2>&1 | grep -q "duplicate version" ); then echo "OK:$s:already-live"; else echo "FAIL:$s:registry"; fi
  fi
done
