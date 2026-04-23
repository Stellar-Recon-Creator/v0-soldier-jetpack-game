#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add lib/game-renderer.ts push_to_github.command

echo "Committing..."
git commit -m "visual: level 5 balaclava now includes tactical goggles over the mask"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
