#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${PORT:-3000}"
URL="http://localhost:${PORT}"
LOG="$(mktemp)"
PID=""

cleanup() {
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null || true
        wait "$PID" 2>/dev/null || true
    fi
    rm -f "$LOG"
}
trap cleanup EXIT

cd "$ROOT"

if [ ! -d "$ROOT/.next" ]; then
    echo "Missing .next build output. Run next build first."
    exit 1
fi

bun --bun next start -p "$PORT" >"$LOG" 2>&1 &
PID=$!

if [ -x "$ROOT/.venv/bin/python" ]; then
    PYTHON="$ROOT/.venv/bin/python"
else
    PYTHON="python3"
fi

if ! "$PYTHON" "$ROOT/tools/seo/wait.py" "$URL"; then
    echo "Server failed to start. Log:"
    cat "$LOG"
    exit 1
fi

"$ROOT/tools/seo/run.sh" "$URL"
