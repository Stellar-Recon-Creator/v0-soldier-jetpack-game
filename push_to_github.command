#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add lib/game-renderer.ts components/game-canvas.tsx push_to_github.command

echo "Committing..."
git commit -m "visual: armor upgrades add knee plates, shoulders, goggles, chest plate, face mask; jetpack scales up with side boosters at max"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
