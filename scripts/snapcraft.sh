#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNAP_LINK="$ROOT_DIR/snap"
CREATED_LINK=0

if [[ -e "$SNAP_LINK" && ! -L "$SNAP_LINK" ]]; then
	echo "Refusing to replace existing snap path: $SNAP_LINK" >&2
	exit 1
fi

if [[ ! -e "$SNAP_LINK" ]]; then
	ln -s packaging/snap "$SNAP_LINK"
	CREATED_LINK=1
fi

cleanup() {
	if [[ "$CREATED_LINK" == "1" ]]; then
		rm -f "$SNAP_LINK"
	fi
}
trap cleanup EXIT

if [[ "${1:-}" == "--sudo" ]]; then
	shift
	sudo /snap/bin/snapcraft pack "$@"
else
	snapcraft pack "$@"
fi
