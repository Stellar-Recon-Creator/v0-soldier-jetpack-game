#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add lib/game-engine.ts lib/game-renderer.ts push_to_github.command

echo "Committing..."
git commit -m "fix: normalize left-facing aim angle so weapon can aim upward-left instead of snapping down"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
