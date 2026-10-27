#!/bin/bash
# Publish every package in published/ to npm. Idempotent: skips versions that
# are already live. Logs one line per package to stdout.
set -u
cd "$(dirname "$0")/.."
LOG=scripts/publish-published.log
: > "$LOG"
OK=0; SKIP=0; FAIL=0
for d in published/*/; do
  d=${d%/}
  [ -f "$d/package.json" ] || continue
  NAME=$(python3 -c "import json;print(json.load(open('$d/package.json'))['name'])")
  VER=$(python3 -c "import json;print(json.load(open('$d/package.json'))['version'])")
  ENC=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$NAME")
  HAVE=$(curl -s -m 15 "https://registry.npmjs.org/$ENC" | python3 -c "import json,sys;print(' '.join(json.load(sys.stdin).get('versions',{}).keys()))" 2>/dev/null)
  if echo " $HAVE " | grep -q " $VER "; then
    echo "SKIP:$NAME:$VER:already-live" | tee -a "$LOG"
    SKIP=$((SKIP+1)); continue
  fi
  OUT=$(cd "$d" && npm publish --access public --no-audit --no-fund 2>&1)
  RC=$?
  if [ "$RC" -eq 0 ] && echo "$OUT" | grep -q "^+ "; then
    echo "OK:$NAME:$VER" | tee -a "$LOG"
    OK=$((OK+1))
  else
    echo "FAIL:$NAME:$VER:$(echo "$OUT" | tail -2 | tr '\n' ' ')" | tee -a "$LOG"
    FAIL=$((FAIL+1))
  fi
  sleep 1
done
echo "DONE ok=$OK skip=$SKIP fail=$FAIL" | tee -a "$LOG"
