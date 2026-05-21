#!/usr/bin/env bash
# release.sh
# Bumps version, updates CHANGELOG.md, creates a git tag, and prints release text.
#
# Usage: ./scripts/release.sh [patch|minor|major]
#   (default: patch)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BUMP="${1:-patch}"

if ! command -v git-cliff &>/dev/null; then
	echo "git-cliff is not installed. Install it with: cargo install git-cliff" >&2
	exit 1
fi

NEXT_TAG="v$(git-cliff --bumped-version --bump "$BUMP")"

echo "━━ Release: $NEXT_TAG ━━"
echo

git-cliff -o CHANGELOG.md --tag "$NEXT_TAG"

echo "Updated CHANGELOG.md"
echo

git add CHANGELOG.md
git commit -m "chore(release): $NEXT_TAG"
git tag "$NEXT_TAG"

echo "Created tag $NEXT_TAG"
echo

echo "━━ Release text ━━"
echo
git-cliff --latest | sed -n '/^## /,/^<!-- generated/p' | sed '$d'
echo
echo "━━ To push: git push origin master --follow-tags ━━"
