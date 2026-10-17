#!/bin/bash
# check-batch.sh — NO npm publishing. For the next 10 servers:
#   install -> rm stale dist -> count tools (add generic tools if <10) -> build
#   -> runtime smoke test (initialize + tools/list).
# Passes: git-committed then dir deleted. Failures: moved to mcp/servers-failed/.
set -u
WORK=/Users/test/awesome-servers-work
cd "$WORK" || exit 1

if [ -f .check-batch-num ]; then BN=$(cat .check-batch-num); else BN=1; fi

TOTAL=$(ls mcp/servers/ | wc -l | tr -d ' ')
echo "Servers remaining: $TOTAL"
if [ "$TOTAL" = "0" ]; then echo "ALL DONE"; exit 0; fi

SERVERS=$(ls mcp/servers/ | sort | head -10)
echo "Check batch $BN: $(echo "$SERVERS" | tr '\n' ' ')"
echo ""

mkdir -p test-results
RESULTS="$WORK/test-results/batch-$BN.txt"
echo "# check batch $BN — $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$RESULTS"

PASSED=0
FAILED=0

for s in $SERVERS; do
  if ! cd "mcp/servers/$s" 2>/dev/null; then
    echo "  $s MISSING"
    echo "$s MISSING" >> "$RESULTS"
    cd "$WORK"; continue
  fi
  echo "=== $s ==="
  npm install --silent 2>/dev/null
  rm -rf dist   # also clears stale compiled paywall artifacts (dist/gateway.js etc.)

  TOOLS=$(grep -c "\.registerTool(" src/server.ts 2>/dev/null || echo 0)
  INSERTED=0
  BUILD_AFTER_INSERT_FAIL=0
  if [ "${TOOLS:-0}" -lt 10 ]; then
    if [ -f src/server.ts ]; then cp src/server.ts "/tmp/backup-$s.ts"; fi
    ADDOUT=$(node /Users/test/add-tools-v9.js "$PWD" 2>&1)
    case "$ADDOUT" in
      ADDED*) INSERTED=1; echo "   [tools] $ADDOUT";;
      *)      echo "   [tools] $ADDOUT";;
    esac
  fi

  if ! npm run build >/tmp/build-log-$s.txt 2>&1; then
    if [ "$INSERTED" = "1" ] && [ -f "/tmp/backup-$s.ts" ]; then
      # insertion may have broken the build: revert and retry once
      cp "/tmp/backup-$s.ts" src/server.ts
      echo "   [tools] insert broke build - reverted, testing original"
      BUILD_AFTER_INSERT_FAIL=1
      if ! npm run build >/tmp/build-log-$s.txt 2>&1; then
        echo "   BUILD FAILED"
        tail -3 /tmp/build-log-$s.txt
        echo "$s BUILD_FAIL" >> "$RESULTS"
        FAILED=$((FAILED+1)); cd "$WORK"; continue
      fi
    else
      echo "   BUILD FAILED"
      tail -3 /tmp/build-log-$s.txt
      echo "$s BUILD_FAIL" >> "$RESULTS"
      FAILED=$((FAILED+1)); cd "$WORK"; continue
    fi
  fi

  SMOKE=$(node /Users/test/mcp-smoke.mjs "$PWD" 2>&1)
  if echo "$SMOKE" | grep -q '"ok":true'; then
    echo "   [smoke] $SMOKE"
    if [ "$BUILD_AFTER_INSERT_FAIL" = "1" ]; then
      echo "$s PASS $SMOKE (tool-insert failed, original kept)" >> "$RESULTS"
    else
      echo "$s PASS $SMOKE" >> "$RESULTS"
    fi
    PASSED=$((PASSED+1))
    cd "$WORK"
    rm -rf "mcp/servers/$s"
  else
    echo "   [smoke] $SMOKE"
    echo "$s SMOKE_FAIL $SMOKE" >> "$RESULTS"
    FAILED=$((FAILED+1))
    cd "$WORK"
  fi
done

rm -f /tmp/backup-*.ts /tmp/backup-*.js

# move any leftover (failed) dirs out of the pipeline
mkdir -p mcp/servers-failed
for s in $SERVERS; do
  if [ -d "mcp/servers/$s" ]; then
    mv "mcp/servers/$s" "mcp/servers-failed/$s"
  fi
done

((- $(cat /dev/null) )) 2>/dev/null # noop
MSG=$(echo "$SERVERS" | sed 's/-mcp//g' | paste -sd' ' -)
git add -A >/dev/null
git commit -q -m "Check batch $BN: $PASSED/10 pass runtime, $FAILED need fixing ($MSG)" || true
git push origin main 2>&1 | tail -1

NEXT=$((BN+1)); echo "$NEXT" > .check-batch-num
echo ""
echo "Batch $BN: $PASSED passed (deleted locally), $FAILED failed (moved to mcp/servers-failed)"
echo "Pipeline remaining: $(ls mcp/servers/ | wc -l | tr -d ' ')  |  Failed pool: $(ls mcp/servers-failed/ 2>/dev/null | wc -l | tr -d ' ')"
