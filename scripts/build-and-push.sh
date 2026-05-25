#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/build-and-push.sh [commit-message] [--desktop]
# If --desktop is provided the `build:desktop` npm script runs (generates dmg + build).

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

MSG="${1:-Build: $(date +"%Y-%m-%d %H:%M:%S")}" 
RUN_DESKTOP=false

if [[ "${2:-}" == "--desktop" || "${1:-}" == "--desktop" ]]; then
  RUN_DESKTOP=true
  if [[ "${1:-}" == "--desktop" ]]; then
    MSG="Build: $(date +"%Y-%m-%d %H:%M:%S")"
  fi
fi

echo "Installing dependencies (if needed)..."
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

if [ "$RUN_DESKTOP" = true ]; then
  echo "Running desktop build (build:desktop)..."
  npm run build:desktop
else
  echo "Running web build (build)..."
  npm run build
fi

echo "Staging changes..."
git add -A

if git diff --cached --quiet; then
  echo "No staged changes to commit. Pushing current branch..."
  git push origin "$(git rev-parse --abbrev-ref HEAD)"
  exit 0
fi

echo "Committing and pushing: $MSG"
git commit -m "$MSG" || true
git push origin "$(git rev-parse --abbrev-ref HEAD)"

echo "Done."
